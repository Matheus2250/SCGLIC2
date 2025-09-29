import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Grid,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import { FilterList, Clear, ExpandMore, ExpandLess } from '@mui/icons-material';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: string | number | null;
}

interface TableFiltersProps {
  fields: FilterField[];
  values: FilterValues;
  onChange: (key: string, value: string | number | null) => void;
  onClear: () => void;
  searchPlaceholder?: string;
}

const TableFilters: React.FC<TableFiltersProps> = ({
  fields,
  values,
  onChange,
  onClear,
  searchPlaceholder = "Pesquisar..."
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onChange('search', value);
  };

  const handleClearAll = () => {
    setSearchValue('');
    onClear();
  };

  const hasActiveFilters = Object.values(values).some(value => 
    value !== null && value !== '' && value !== undefined
  );

  return (
    <Box sx={{ mb: 2 }}>
      {/* Search bar and filter toggle */}
      <Paper sx={{ p: 2, mb: expanded ? 2 : 0 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="small"
          />
          
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            color={hasActiveFilters ? 'primary' : 'default'}
            title="Filtros avançados"
          >
            <FilterList />
          </IconButton>
          
          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Clear />}
              onClick={handleClearAll}
            >
              Limpar
            </Button>
          )}
          
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Paper>

      {/* Advanced filters */}
      <Collapse in={expanded}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            Filtros Avançados
          </Typography>
          <Grid container spacing={2}>
            {(fields || []).map((field) => (
              <Grid item xs={12} sm={6} md={4} key={field.key}>
                {field.type === 'select' ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>{field.label}</InputLabel>
                    <Select
                      value={values[field.key] || ''}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      label={field.label}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {(field.options || []).map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label={field.label}
                    type={field.type}
                    value={values[field.key] || ''}
                    onChange={(e) => onChange(field.key, 
                      field.type === 'number' ? parseFloat(e.target.value) || null : e.target.value
                    )}
                    placeholder={field.placeholder}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default TableFilters;