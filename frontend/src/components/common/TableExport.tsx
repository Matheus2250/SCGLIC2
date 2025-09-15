import React from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
} from '@mui/material';
import {
  FileDownload,
  GridOn,
  PictureAsPdf,
  InsertDriveFile,
} from '@mui/icons-material';
import { utils, writeFileXLSX } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Column {
  key: string;
  label: string;
  formatter?: (value: any) => string;
}

interface TableExportProps {
  data: any[];
  columns: Column[];
  filename: string;
  title?: string;
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const TableExport: React.FC<TableExportProps> = ({
  data,
  columns,
  filename,
  title = 'Relatório'
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const prepareData = () => {
    return data.map(row => {
      const processedRow: any = {};
      columns.forEach(column => {
        let value = row[column.key];
        
        if (column.formatter) {
          value = column.formatter(value);
        } else if (typeof value === 'number' && column.key.includes('valor')) {
          value = formatCurrency(value);
        } else if (typeof value === 'string' && column.key.includes('data')) {
          value = formatDate(value);
        } else if (value === null || value === undefined) {
          value = 'N/A';
        }
        
        processedRow[column.label] = value;
      });
      return processedRow;
    });
  };

  const exportToExcel = () => {
    const processedData = prepareData();
    const worksheet = utils.json_to_sheet(processedData);
    
    // Auto-width columns
    const colWidths = columns.map(col => {
      const maxLength = Math.max(
        col.label.length,
        ...processedData.map(row => String(row[col.label] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 30) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Dados');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    writeFileXLSX(workbook, `${filename}_${timestamp}.xlsx`);
    handleClose();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const processedData = prepareData();
    
    // Title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 25);
    
    // Table
    const tableColumns = columns.map(col => col.label);
    const tableRows = processedData.map(row => 
      columns.map(col => row[col.label] || 'N/A')
    );

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        // Adjust column widths based on content
        ...columns.reduce((acc, col, index) => {
          if (col.key.includes('valor')) {
            acc[index] = { halign: 'right' };
          } else if (col.key.includes('data')) {
            acc[index] = { halign: 'center' };
          }
          return acc;
        }, {} as any)
      },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      pageBreak: 'auto',
      showHead: 'everyPage',
    });
    
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    doc.save(`${filename}_${timestamp}.pdf`);
    handleClose();
  };

  const exportToCSV = () => {
    const processedData = prepareData();
    
    // Create CSV content
    const headers = columns.map(col => col.label);
    const csvContent = [
      headers.join(','),
      ...processedData.map(row => 
        columns.map(col => {
          const value = row[col.label] || '';
          // Escape commas and quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    link.setAttribute('download', `${filename}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleClose();
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<FileDownload />}
        onClick={handleClick}
        size="small"
      >
        Exportar ({data.length} registros)
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={exportToExcel}>
          <ListItemIcon>
            <GridOn fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Excel (.xlsx)</ListItemText>
        </MenuItem>
        <MenuItem onClick={exportToPDF}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={exportToCSV}>
          <ListItemIcon>
            <InsertDriveFile fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>CSV</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TableExport;