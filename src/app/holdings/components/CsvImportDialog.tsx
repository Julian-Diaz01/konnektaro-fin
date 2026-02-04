'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CreateUserStockInput } from '@/types/userStocks'
import { formatCurrency } from '@/lib/format'

type ImportStatus = 'pending' | 'importing' | 'success' | 'error'

interface ParsedHolding extends CreateUserStockInput {
  rowIndex: number
  errors?: string[]
  importStatus?: ImportStatus
  importError?: string
}

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (holding: CreateUserStockInput) => Promise<void>
  onClose?: () => void
}

// Constants
const IMPORT_DELAY_MS = 300
const CSV_PARSE_DEBOUNCE_MS = 300

// Utility functions - moved outside component to avoid recreation
const parseCsvLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name))
    if (index !== -1) return index
  }
  return -1
}

const normalizeDate = (dateStr: string): string | null => {
  if (!dateStr) return null

  // Handle YYYYMMDD format (e.g., "20260129")
  if (/^\d{8}$/.test(dateStr)) {
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${year}-${month}-${day}`
  }

  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // Handle YYYY/MM/DD format
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    return dateStr.replace(/\//g, '-')
  }

  // Try to parse as Date
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return null
}


export function CsvImportDialog ({
  open,
  onOpenChange,
  onImport,
  onClose
}: CsvImportDialogProps) {
  const [parsedHoldings, setParsedHoldings] = useState<ParsedHolding[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [failedCount, setFailedCount] = useState(0)
  const [hasImported, setHasImported] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const parseTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Memoized computed values
  const validHoldings = useMemo(
    () => parsedHoldings.filter(h => !h.errors || h.errors.length === 0),
    [parsedHoldings]
  )

  const invalidHoldings = useMemo(
    () => parsedHoldings.filter(h => h.errors && h.errors.length > 0),
    [parsedHoldings]
  )

  const parseCsv = useCallback((csvText: string) => {
    try {
      const lines = csvText.trim().split('\n').filter(line => line.trim())
      if (lines.length === 0) {
        setParsedHoldings([])
        return
      }

      // Parse header
      const headerLine = lines[0]
      if (!headerLine) {
        setParsedHoldings([])
        return
      }

      const headers = parseCsvLine(headerLine).map(h => h.trim().toLowerCase())

      // Find column indices
      const symbolIndex = findColumnIndex(headers, ['symbol', 'ticker', 'stock'])
      const quantityIndex = findColumnIndex(headers, ['quantity', 'qty', 'shares', 'amount'])
      const purchasePriceIndex = findColumnIndex(headers, ['purchase price', 'price', 'cost', 'purchaseprice'])
      const purchaseDateIndex = findColumnIndex(headers, ['trade date', 'purchase date', 'date', 'tradedate', 'purchasedate'])
      const commissionIndex = findColumnIndex(headers, ['commission', 'fee', 'commission fee'])

      if (symbolIndex === -1 || quantityIndex === -1) {
        toast.error('CSV must contain Symbol and Quantity columns')
        setParsedHoldings([])
        return
      }

      // Parse data rows
      const holdings: ParsedHolding[] = []

      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i] ?? '')
        const errorsForRow: string[] = []

        const symbol = row[symbolIndex]?.trim().toUpperCase()
        const quantityStr = row[quantityIndex]?.trim()
        const purchasePriceStr = row[purchasePriceIndex]?.trim()
        const purchaseDateStr = row[purchaseDateIndex]?.trim()
        const commissionStr = row[commissionIndex]?.trim()

        if (!symbol) {
          errorsForRow.push('Symbol is required')
        }

        const quantity = parseFloat(quantityStr || '0')
        if (isNaN(quantity) || quantity <= 0) {
          errorsForRow.push('Quantity must be a positive number')
        }

        let purchasePrice: number | null = null
        if (purchasePriceStr) {
          const price = parseFloat(purchasePriceStr)
          if (isNaN(price) || price < 0) {
            errorsForRow.push('Purchase price must be a non-negative number')
          } else {
            purchasePrice = price
            // Add commission to purchase price if provided
            if (commissionStr) {
              const commission = parseFloat(commissionStr)
              if (!isNaN(commission) && commission > 0) {
                purchasePrice = (purchasePrice * quantity + commission) / quantity
              }
            }
          }
        }

        let purchaseDate: string | null = null
        if (purchaseDateStr) {
          purchaseDate = normalizeDate(purchaseDateStr)
          if (!purchaseDate) {
            errorsForRow.push('Invalid date format')
          }
        }

        if (errorsForRow.length === 0 && symbol && quantity > 0) {
          holdings.push({
            symbol,
            quantity,
            purchasePrice: purchasePrice ?? undefined,
            purchaseDate: purchaseDate ?? undefined,
            rowIndex: i + 1
          })
        } else if (symbol) {
          holdings.push({
            symbol,
            quantity,
            purchasePrice: purchasePrice ?? undefined,
            purchaseDate: purchaseDate ?? undefined,
            rowIndex: i + 1,
            errors: errorsForRow
          })
        }
      }

      if (holdings.length === 0) {
        toast.error('No valid holdings found in CSV')
      } else {
        const validCount = holdings.filter(h => !h.errors || h.errors.length === 0).length
        const invalidCount = holdings.length - validCount
        if (invalidCount > 0) {
          toast.warning(`${validCount} valid, ${invalidCount} invalid rows found`)
        } else {
          toast.success(`Found ${validCount} holdings to import`)
        }
      }

      setParsedHoldings(holdings)
    } catch (error) {
      toast.error('Failed to parse CSV')
      console.error(error)
      setParsedHoldings([])
    }
  }, [])

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    try {
      const text = await file.text()
      setCsvContent(text)
      parseCsv(text)
    } catch (error) {
      toast.error('Failed to read file')
      console.error(error)
    }
  }, [parseCsv])

  const handlePaste = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value
    setCsvContent(text)
    
    // Clear existing timeout
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current)
    }

    // Debounce CSV parsing
    if (text.trim()) {
      parseTimeoutRef.current = setTimeout(() => {
        parseCsv(text)
      }, CSV_PARSE_DEBOUNCE_MS)
    } else {
      setParsedHoldings([])
    }
  }, [parseCsv])

  // Optimized update function for single holding status
  const updateHoldingStatus = useCallback((
    symbol: string,
    rowIndex: number,
    updates: Partial<Omit<ParsedHolding, 'symbol' | 'rowIndex'>>
  ) => {
    setParsedHoldings(prev => {
      const index = prev.findIndex(h => h.symbol === symbol && h.rowIndex === rowIndex)
      if (index === -1) return prev
      
      const newHoldings = [...prev]
      const currentHolding = newHoldings[index]
      newHoldings[index] = {
        ...currentHolding,
        ...updates
      } as ParsedHolding
      return newHoldings
    })
  }, [])

  const handleImport = useCallback(async () => {
    if (validHoldings.length === 0) {
      toast.error('No valid holdings to import')
      return
    }

    setIsImporting(true)
    
    // Reset import status for all holdings in a single update
    setParsedHoldings(prev => prev.map(h => ({
      ...h,
      importStatus: 'pending' as ImportStatus,
      importError: undefined
    })))

    let successCount = 0
    let failCount = 0

    // Import holdings one by one with delay to avoid overwhelming the server
    for (let i = 0; i < validHoldings.length; i++) {
      const holding = validHoldings[i]
      if (!holding) continue
      
      // Add delay between requests (except for the first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, IMPORT_DELAY_MS))
      }
      
      // Set status to importing
      updateHoldingStatus(holding.symbol, holding.rowIndex, {
        importStatus: 'importing'
      })

      try {
        await onImport(holding)
        successCount++
        
        // Set status to success
        updateHoldingStatus(holding.symbol, holding.rowIndex, {
          importStatus: 'success'
        })
      } catch (error) {
        failCount++
        const errorMessage = error instanceof Error ? error.message : 'Failed to import'
        
        // Set status to error
        updateHoldingStatus(holding.symbol, holding.rowIndex, {
          importStatus: 'error',
          importError: errorMessage
        })
      }
    }

    setIsImporting(false)
    setFailedCount(failCount)
    setHasImported(true)

    if (failCount === 0 && successCount > 0) {
      toast.success(`Successfully imported ${successCount} holdings`)
    } else if (failCount > 0) {
      toast.warning(`Imported ${successCount} holdings, ${failCount} failed`)
    }
  }, [validHoldings, onImport, updateHoldingStatus])

  const handleRetryFailed = useCallback(async () => {
    const failedHoldings = parsedHoldings.filter(
      (h): h is ParsedHolding => {
        const hasNoValidationErrors = !h.errors || h.errors.length === 0
        return hasNoValidationErrors && h.importStatus === 'error'
      }
    )
    
    if (failedHoldings.length === 0) {
      return
    }

    setIsImporting(true)
    setFailedCount(0)

    let successCount = 0
    let failCount = 0

    // Retry failed holdings one by one with delay
    for (let i = 0; i < failedHoldings.length; i++) {
      const holding = failedHoldings[i]
      if (!holding) continue
      
      // Add delay between requests (except for the first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, IMPORT_DELAY_MS))
      }
      
      // Set status to importing
      updateHoldingStatus(holding.symbol, holding.rowIndex, {
        importStatus: 'importing',
        importError: undefined
      })

      try {
        await onImport(holding)
        successCount++
        
        // Set status to success
        updateHoldingStatus(holding.symbol, holding.rowIndex, {
          importStatus: 'success'
        })
      } catch (error) {
        failCount++
        const errorMessage = error instanceof Error ? error.message : 'Failed to import'
        
        // Set status to error
        updateHoldingStatus(holding.symbol, holding.rowIndex, {
          importStatus: 'error',
          importError: errorMessage
        })
      }
    }

    setIsImporting(false)
    setFailedCount(failCount)

    if (failCount === 0) {
      toast.success(`Successfully retried ${successCount} holdings`)
    } else {
      toast.warning(`Retried ${successCount} holdings, ${failCount} still failed`)
    }
  }, [parsedHoldings, onImport, updateHoldingStatus])

  const handleRetry = useCallback(async (holding: ParsedHolding) => {
    // Set status to importing
    updateHoldingStatus(holding.symbol, holding.rowIndex, {
      importStatus: 'importing',
      importError: undefined
    })

    try {
      await onImport(holding)
      
      // Set status to success
      updateHoldingStatus(holding.symbol, holding.rowIndex, {
        importStatus: 'success'
      })
      
      toast.success(`Successfully imported ${holding.symbol}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import'
      
      // Set status to error
      updateHoldingStatus(holding.symbol, holding.rowIndex, {
        importStatus: 'error',
        importError: errorMessage
      })
      
      toast.error(`Failed to import ${holding.symbol}: ${errorMessage}`)
    }
  }, [onImport, updateHoldingStatus])

  const handleClose = useCallback(() => {
    // Clear any pending parse timeout
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current)
    }

    setParsedHoldings([])
    setCsvContent('')
    setIsImporting(false)
    setFailedCount(0)
    setHasImported(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
    // Call onClose callback after dialog closes to refresh data
    if (onClose) {
      onClose()
    }
  }, [onOpenChange, onClose])

  const handleFinish = useCallback(() => {
    handleClose()
  }, [handleClose])

  const handleButtonClick = useCallback(() => {
    if (hasImported && failedCount > 0) {
      return handleRetryFailed()
    }
    if (hasImported && failedCount === 0) {
      return handleFinish()
    }
    return handleImport()
  }, [hasImported, failedCount, handleRetryFailed, handleFinish, handleImport])

  const buttonText = useMemo(() => {
    if (isImporting) {
      return { icon: Loader2, text: 'Importing...', spinning: true }
    }
    if (hasImported && failedCount > 0) {
      return { icon: RotateCcw, text: `Retry ${failedCount}`, spinning: false }
    }
    if (hasImported && failedCount === 0) {
      return { icon: CheckCircle2, text: 'Finish', spinning: false }
    }
    return { icon: FileText, text: `Import ${validHoldings.length} Holdings`, spinning: false }
  }, [isImporting, hasImported, failedCount, validHoldings.length])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Holdings from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste CSV content. The file should include columns for Symbol, Quantity, Purchase Price (optional), and Trade Date (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
          </div>

          {/* Paste CSV */}
          <div className="space-y-2">
            <Label>Or Paste CSV Content</Label>
            <textarea
              value={csvContent}
              onChange={handlePaste}
              placeholder="Paste CSV content here..."
              className="w-full min-h-[120px] px-3 py-2 text-sm border rounded-md resize-y font-mono"
            />
          </div>

          {/* Preview Table */}
          {parsedHoldings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preview ({validHoldings.length} valid, {invalidHoldings.length} invalid)</Label>
              </div>
              <div className="border rounded-md overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Row</th>
                      <th className="text-left py-2 px-3 font-medium">Symbol</th>
                      <th className="text-right py-2 px-3 font-medium">Quantity</th>
                      <th className="text-right py-2 px-3 font-medium">Purchase Price</th>
                      <th className="text-left py-2 px-3 font-medium">Purchase Date</th>
                      <th className="text-left py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedHoldings.map((holding) => (
                      <HoldingRow
                        key={`${holding.symbol}-${holding.rowIndex}`}
                        holding={holding}
                        onRetry={handleRetry}
                        isImporting={isImporting}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleButtonClick}
            disabled={isImporting || (!hasImported && validHoldings.length === 0)}
          >
            {buttonText.spinning ? (
              <>
                <buttonText.icon className="mr-2 h-4 w-4 animate-spin" />
                {buttonText.text}
              </>
            ) : (
              <>
                <buttonText.icon className="mr-2 h-4 w-4" />
                {buttonText.text}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Extracted row component for better performance
interface HoldingRowProps {
  holding: ParsedHolding
  onRetry: (holding: ParsedHolding) => void
  isImporting: boolean
}

function HoldingRow ({ holding, onRetry, isImporting }: HoldingRowProps) {
  const hasErrors = holding.errors && holding.errors.length > 0
  const importStatus = holding.importStatus || 'pending'
  const isImportingStatus = importStatus === 'importing'
  const isSuccess = importStatus === 'success'
  const isError = importStatus === 'error'

  return (
    <tr
      className={`border-b ${
        hasErrors 
          ? 'bg-destructive/10' 
          : isSuccess 
            ? 'bg-success/10' 
            : isError 
              ? 'bg-destructive/5' 
              : ''
      }`}
    >
      <td className="py-2 px-3 font-mono text-xs">{holding.rowIndex}</td>
      <td className="py-2 px-3 font-medium">{holding.symbol}</td>
      <td className="text-right py-2 px-3 font-mono">{holding.quantity.toFixed(2)}</td>
      <td className="text-right py-2 px-3 font-mono">
        {holding.purchasePrice !== undefined && holding.purchasePrice !== null
          ? formatCurrency(holding.purchasePrice)
          : '-'}
      </td>
      <td className="py-2 px-3 font-mono text-xs">
        {holding.purchaseDate || '-'}
      </td>
      <td className="py-2 px-3">
        {hasErrors ? (
          <div className="flex items-center gap-1 text-destructive text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{holding.errors?.join(', ')}</span>
          </div>
        ) : isImportingStatus ? (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Importing...</span>
          </div>
        ) : isSuccess ? (
          <div className="flex items-center gap-1 text-success text-xs">
            <CheckCircle2 className="h-3 w-3" />
            <span>Added</span>
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-destructive text-xs flex-1">
              <AlertCircle className="h-3 w-3" />
              <span className="truncate max-w-[120px]" title={holding.importError}>
                {holding.importError || 'Failed'}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRetry(holding)}
              disabled={isImporting}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <CheckCircle2 className="h-3 w-3" />
            <span>Valid</span>
          </div>
        )}
      </td>
    </tr>
  )
}
