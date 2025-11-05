import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, IconButton, Button, MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip } from '@mui/material';
import { Add, Delete, Edit, Save } from '@mui/icons-material';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend } from 'recharts';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAuth } from '../../store/auth.context';

export type ChartType = 'pie' | 'bar' | 'line';

export interface DatasetMap { [key: string]: any[] }

export interface WidgetConfig {
  id: string;
  title: string;
  type: ChartType;
  dataset: string; // key to DatasetMap
  xKey?: string;   // for bar/line
  yKey?: string;   // for bar/line
  color?: string;
  md?: 6 | 12 | 4 | 8; // grid size
}

interface DashboardBuilderProps {
  storageKey: string;        // localStorage key to persist user layout
  datasets: DatasetMap;      // data available
  defaults: WidgetConfig[];  // default widgets if no saved
}

const ChartRenderer: React.FC<{ cfg: WidgetConfig; data: any[] }> = ({ cfg, data }) => {
  const color = cfg.color || '#0d6efd';
  if (cfg.type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie data={data} dataKey={cfg.yKey || 'value'} nameKey={cfg.xKey || 'name'} cx="50%" cy="50%" outerRadius={80}>
            {data.map((d, idx) => (
              <Cell key={idx} fill={d.color || color} />
            ))}
          </Pie>
          <RTooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (cfg.type === 'line') {
    return (
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={cfg.xKey || 'name'} />
          <YAxis />
          <RTooltip />
          <Legend />
          <Line type="monotone" dataKey={cfg.yKey || 'value'} stroke={color} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  // bar default
  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={cfg.xKey || 'name'} />
        <YAxis />
        <RTooltip />
        <Legend />
        <Bar dataKey={cfg.yKey || 'value'} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardBuilder: React.FC<DashboardBuilderProps> = ({ storageKey, datasets, defaults }) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [layouts, setLayouts] = useState<Layouts>({ lg: [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WidgetConfig | null>(null);

  const { user } = useAuth();
  const KEY_BASE = `${storageKey}:u:${user?.id || 'anon'}`;
  const LAYOUT_KEY = `${KEY_BASE}:layouts`;
  const WIDGETS_KEY = `${KEY_BASE}:widgets`;

  useEffect(() => {
    try {
      const w = localStorage.getItem(WIDGETS_KEY);
      setWidgets(w ? JSON.parse(w) : defaults);
      const l = localStorage.getItem(LAYOUT_KEY);
      setLayouts(l ? JSON.parse(l) : { lg: defaults.map((d, idx) => ({ i: d.id, x: (idx % 2) * 6, y: Math.floor(idx / 2) * 8, w: d.md || 6, h: 8 })) });
    } catch {
      setWidgets(defaults);
      setLayouts({ lg: defaults.map((d, idx) => ({ i: d.id, x: (idx % 2) * 6, y: Math.floor(idx / 2) * 8, w: d.md || 6, h: 8 })) });
    }
  }, [storageKey, defaults]);

  const persist = (nextWidgets: WidgetConfig[], nextLayouts?: Layouts) => {
    setWidgets(nextWidgets);
    const L = nextLayouts || layouts;
    setLayouts(L);
    try {
      localStorage.setItem(WIDGETS_KEY, JSON.stringify(nextWidgets));
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(L));
    } catch {}
  };

  const handleAdd = () => {
    const id = crypto.randomUUID();
    setEditing({ id, title: 'Novo Gráfico', type: 'bar', dataset: Object.keys(datasets)[0], xKey: 'name', yKey: 'value', color: '#0d6efd', md: 6 });
    setOpen(true);
  };

  const handleEdit = (w: WidgetConfig) => { setEditing({ ...w }); setOpen(true); };
  const handleDelete = (id: string) => {
    const nextWidgets = widgets.filter(w => w.id !== id);
    const nextLayouts: Layouts = {
      lg: (layouts.lg || []).filter((li: any) => li.i !== id)
    };
    persist(nextWidgets, nextLayouts);
  };

  const handleSave = () => {
    if (!editing) return;
    const exists = widgets.some(w => w.id === editing.id);
    let nextLayouts = layouts;
    if (!exists) {
      // add default layout item
      const li: Layout = { i: editing.id, x: 0, y: Infinity, w: editing.md || 6, h: 8 };
      nextLayouts = { lg: [...(layouts.lg || []), li] } as Layouts;
    }
    const next = exists ? widgets.map(w => (w.id === editing.id ? editing : w)) : [...widgets, editing];
    persist(next, nextLayouts);
    setOpen(false);
  };

  const mdOptions: (4|6|8|12)[] = [4,6,8,12];

  return (
    <Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
        <Typography variant="h6">Seu painel</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={handleAdd}>Adicionar gráfico</Button>
      </Box>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        cols={{ lg: 12, md: 12, sm: 12, xs: 6, xxs: 4 }}
        rowHeight={40}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        onLayoutChange={(current, all) => persist(widgets, all as any)}
        isDraggable
        isResizable
      >
        {widgets.map(w => (
          <div key={w.id} data-grid={(layouts.lg || []).find((li: any) => li.i === w.id) || undefined}>
            <Paper sx={{ p:2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb:1 }}>
                <Typography variant="subtitle1">{w.title}</Typography>
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                  <Tooltip title="Editar"><IconButton size="small" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handleEdit(w); }}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Excluir"><IconButton size="small" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handleDelete(w.id); }}><Delete fontSize="small" /></IconButton></Tooltip>
                </Box>
              </Box>
              <Box sx={{ height: 320 }}>
                <ChartRenderer cfg={w} data={datasets[w.dataset] || []} />
              </Box>
            </Paper>
          </div>
        ))}
      </ResponsiveGridLayout>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing && widgets.some(w => w.id === editing.id) ? 'Editar gráfico' : 'Adicionar gráfico'}</DialogTitle>
        <DialogContent>
          {editing && (
            <Box sx={{ display:'grid', gap:2, mt:1 }}>
              <TextField label="Título" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select label="Tipo" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as ChartType })}>
                  <MenuItem value="bar">Barras</MenuItem>
                  <MenuItem value="line">Linha</MenuItem>
                  <MenuItem value="pie">Pizza</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Dataset</InputLabel>
                <Select label="Dataset" value={editing.dataset} onChange={(e) => setEditing({ ...editing, dataset: e.target.value })}>
                  {Object.keys(datasets).map(k => (<MenuItem key={k} value={k}>{k}</MenuItem>))}
                </Select>
              </FormControl>
              {editing.type !== 'pie' && (
                <>
                  <TextField label="Campo X (nome)" value={editing.xKey || 'name'} onChange={(e) => setEditing({ ...editing, xKey: e.target.value })} fullWidth />
                  <TextField label="Campo Y (valor)" value={editing.yKey || 'value'} onChange={(e) => setEditing({ ...editing, yKey: e.target.value })} fullWidth />
                </>
              )}
              <TextField label="Cor" value={editing.color || ''} onChange={(e) => setEditing({ ...editing, color: e.target.value })} placeholder="#0d6efd" fullWidth />
              <FormControl fullWidth>
                <InputLabel>Largura</InputLabel>
                <Select label="Largura" value={(editing.md || 6) as any} onChange={(e) => setEditing({ ...editing, md: Number(e.target.value) as any })}>
                  {mdOptions.map(o => (<MenuItem key={o} value={o}>{o === 12 ? '100%' : `${Math.round(o/12*100)}%`}</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} startIcon={<Save />}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardBuilder;
