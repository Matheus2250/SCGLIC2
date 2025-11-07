import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, IconButton, Button, MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip } from '@mui/material';
import { Add, Delete, Edit, Save } from '@mui/icons-material';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend } from 'recharts';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAuth } from '../../store/auth.context';
import { licitacaoService } from '../../services/licitacao.service';
import { Licitacao } from '../../types';

type ChartType = 'pie' | 'bar' | 'line';

interface WidgetConfig {
  id: string;
  title: string;
  type: ChartType;
  xField: keyof Licitacao | string;
  yField?: keyof Licitacao | string;
  metric: 'count' | 'value'; // value = soma de valor_homologado
  palette?: 'default' | 'categorical' | 'pastel' | 'vibrant' | 'mui';
  md?: 6 | 12 | 4 | 8;
}

interface Props { storageKey: string }

const fieldLabels: { label: string; key: keyof Licitacao | string }[] = [
  { label: 'Status', key: 'status' },
  { label: 'Modalidade', key: 'modalidade' },
  { label: 'Área Demandante', key: 'area_demandante' },
  { label: 'Pregoeiro', key: 'pregoeiro' },
  { label: 'Ano', key: 'ano' },
  { label: 'Total de Licitações', key: '__total__' },
];

const getPalette = (name: WidgetConfig['palette']) => {
  switch (name) {
    case 'categorical': return ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    case 'pastel': return ['#a6cee3','#b2df8a','#fb9a99','#fdbf6f','#cab2d6','#ffff99','#1f78b4','#33a02c','#e31a1c','#ff7f00'];
    case 'vibrant': return ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'];
    case 'mui': return ['#1976d2','#9c27b0','#2e7d32','#ed6c02','#d32f2f','#0288d1','#6a1b9a','#43a047','#ff9800','#c2185b'];
    default: return ['#0d6efd','#6610f2','#198754','#dc3545','#fd7e14','#20c997','#6f42c1'];
  }
};

type SeriesResult = { data: any[]; seriesKeys?: string[] };

const aggregate = (items: Licitacao[], xField: string, metric: 'count'|'value', yField?: string): SeriesResult => {
  const safe = (v: any) => (v === null || v === undefined || v === '') ? '—' : v;
  const valueOf = (it: any) => Number(it?.valor_homologado || 0);
  if (xField === '__total__') {
    if (!yField) {
      const value = metric === 'count' ? items.length : items.reduce((a, it) => a + valueOf(it), 0);
      return { data: [{ name: 'Total', value }] };
    }
    const map = new Map<string, number>();
    for (const it of items) {
      const y = String(safe((it as any)[yField]));
      const add = metric === 'count' ? 1 : valueOf(it);
      map.set(y, (map.get(y) || 0) + add);
    }
    return { data: Array.from(map, ([name, value]) => ({ name, value })) };
  }
  if (!yField) {
    const map = new Map<string, number>();
    for (const it of items) {
      const x = String(safe((it as any)[xField]));
      const add = metric === 'count' ? 1 : valueOf(it);
      map.set(x, (map.get(x) || 0) + add);
    }
    return { data: Array.from(map, ([name, value]) => ({ name, value })) };
  }
  const outer = new Map<string, Map<string, number>>();
  const ySet = new Set<string>();
  for (const it of items) {
    const x = String(safe((it as any)[xField]));
    const y = String(safe((it as any)[yField]));
    const add = metric === 'count' ? 1 : valueOf(it);
    if (!outer.has(x)) outer.set(x, new Map());
    const inner = outer.get(x)!;
    inner.set(y, (inner.get(y) || 0) + add);
    ySet.add(y);
  }
  const keys = Array.from(ySet);
  const data = Array.from(outer, ([X, inner]) => {
    const row: any = { name: X };
    for (const k of keys) row[k] = inner.get(k) || 0;
    return row;
  });
  return { data, seriesKeys: keys };
};

const ResponsiveGridLayout = WidthProvider(Responsive);

const Chart: React.FC<{ cfg: WidgetConfig; data: any[]; seriesKeys?: string[] }> = ({ cfg, data, seriesKeys }) => {
  const colors = getPalette(cfg.palette);
  if (cfg.type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie data={data} dataKey={'value'} nameKey={'name'} cx="50%" cy="50%" outerRadius={80}>
            {data.map((_: any, idx: number) => (<Cell key={idx} fill={colors[idx % colors.length]} />))}
          </Pie>
          <RTooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (cfg.type === 'line' && !seriesKeys) {
    return (
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={'name'} />
          <YAxis />
          <RTooltip />
          <Legend />
          <Line type="monotone" dataKey={'value'} stroke={colors[0]} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={'name'} />
        <YAxis />
        <RTooltip />
        <Legend />
        {seriesKeys && seriesKeys.length ? (
          seriesKeys.map((k, idx) => (<Bar key={k} dataKey={k} fill={colors[idx % colors.length]} />))
        ) : (
          <Bar dataKey={'value'}>
            {data.map((_: any, idx: number) => (<Cell key={idx} fill={colors[idx % colors.length]} />))}
          </Bar>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};

const DashboardBuilderLicitacao: React.FC<Props> = ({ storageKey }) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [layouts, setLayouts] = useState<Layouts>({ lg: [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WidgetConfig | null>(null);
  const [rows, setRows] = useState<Licitacao[]>([]);
  const { user } = useAuth();
  const KEY_BASE = `${storageKey}:u:${user?.id || 'anon'}`;
  const LAYOUT_KEY = `${KEY_BASE}:layouts`;
  const WIDGETS_KEY = `${KEY_BASE}:widgets`;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const limit = 500; let skip = 0; let all: Licitacao[] = [];
        for (let i = 0; i < 20; i++) {
          const batch = await licitacaoService.getAll(skip, limit);
          all = all.concat(batch || []);
          if (!batch || batch.length < limit) break;
          skip += limit;
        }
        setRows(all);
      } catch { setRows([]); }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    try {
      const w = localStorage.getItem(WIDGETS_KEY);
      setWidgets(w ? JSON.parse(w) : []);
      const l = localStorage.getItem(LAYOUT_KEY);
      setLayouts(l ? JSON.parse(l) : { lg: [] });
    } catch { setWidgets([]); setLayouts({ lg: [] }); }
  }, [WIDGETS_KEY, LAYOUT_KEY]);

  const persist = (nextWidgets: WidgetConfig[], nextLayouts?: Layouts) => {
    setWidgets(nextWidgets);
    const L = nextLayouts || layouts; setLayouts(L);
    try {
      localStorage.setItem(WIDGETS_KEY, JSON.stringify(nextWidgets));
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(L));
    } catch {}
  };

  const handleAdd = () => {
    const id = crypto.randomUUID();
    setEditing({ id, title: 'Novo gráfico', type: 'bar', xField: 'status', metric: 'count', palette: 'categorical', md: 6 });
    setOpen(true);
  };

  const handleEdit = (w: WidgetConfig) => { setEditing({ ...w }); setOpen(true); };
  const handleDelete = (id: string) => {
    const nextWidgets = widgets.filter(w => w.id !== id);
    const nextLayouts: Layouts = { lg: (layouts.lg || []).filter((li: any) => li.i !== id) } as Layouts;
    persist(nextWidgets, nextLayouts);
  };

  const handleSave = () => {
    if (!editing) return;
    const exists = widgets.some(w => w.id === editing.id);
    let nextLayouts = layouts;
    if (!exists) {
      const li: Layout = { i: editing.id, x: 0, y: Infinity, w: editing.md || 6, h: 8 };
      nextLayouts = { lg: [...(layouts.lg || []), li] } as Layouts;
    }
    const next = exists ? widgets.map(w => (w.id === editing.id ? editing : w)) : [...widgets, editing];
    persist(next, nextLayouts);
    setOpen(false);
  };

  const mdOptions: (4|6|8|12)[] = [4,6,8,12];
  const paletteOptions: NonNullable<WidgetConfig['palette']>[] = ['categorical','pastel','vibrant','mui','default'];

  return (
    <Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
        <Typography variant="h6">Seu painel (Licitação)</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={handleAdd}>Adicionar gráfico</Button>
      </Box>
      <ResponsiveGridLayout className="layout" layouts={layouts} cols={{ lg: 12, md: 12, sm: 12, xs: 6, xxs: 4 }} rowHeight={40} breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} onLayoutChange={(current, all) => persist(widgets, all as any)} isDraggable isResizable>
        {widgets.map(w => {
          const { data, seriesKeys } = aggregate(rows, String(w.xField), w.metric, w.yField ? String(w.yField) : undefined);
          const type = w.type === 'line' && seriesKeys && seriesKeys.length ? 'bar' : w.type;
          const cfg = { ...w, type } as WidgetConfig;
          return (
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
                  <Chart cfg={cfg} data={data} seriesKeys={seriesKeys} />
                </Box>
              </Paper>
            </div>
          );
        })}
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
                <InputLabel>Campo X</InputLabel>
                <Select label="Campo X" value={editing.xField} onChange={(e) => setEditing({ ...editing, xField: e.target.value as any })}>
                  {fieldLabels.map(opt => (<MenuItem key={opt.key as string} value={opt.key as string}>{opt.label}</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Campo Y (opcional)</InputLabel>
                <Select label="Campo Y (opcional)" value={editing.yField || ''} onChange={(e) => setEditing({ ...editing, yField: (e.target.value || undefined) as any })}>
                  <MenuItem value="">(Nenhum)</MenuItem>
                  {fieldLabels.map(opt => (<MenuItem key={opt.key as string} value={opt.key as string}>{opt.label}</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Métrica</InputLabel>
                <Select label="Métrica" value={editing.metric} onChange={(e) => setEditing({ ...editing, metric: e.target.value as any })}>
                  <MenuItem value="count">Quantidade</MenuItem>
                  <MenuItem value="value">Valor Homologado</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Paleta de cores</InputLabel>
                <Select label="Paleta de cores" value={editing.palette || 'categorical'} onChange={(e) => setEditing({ ...editing, palette: e.target.value as any })}>
                  {(['categorical','pastel','vibrant','mui','default'] as const).map(p => (<MenuItem key={p} value={p}>{p}</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Largura</InputLabel>
                <Select label="Largura" value={(editing.md || 6) as any} onChange={(e) => setEditing({ ...editing, md: Number(e.target.value) as any })}>
                  {[4,6,8,12].map(o => (<MenuItem key={o} value={o}>{o === 12 ? '100%' : `${Math.round(o/12*100)}%`}</MenuItem>))}
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

export default DashboardBuilderLicitacao;

