import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Activity, BarChart3, Leaf, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#064e3b', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500">Failed to load statistics</p>
      </div>
    );
  }

  // Prepare chart data
  const diseaseChartData = Object.entries(stats.disease_distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([disease, count]) => ({
      name: disease.replace(/_/g, ' '),
      count,
    }));

  const cropChartData = Object.entries(stats.crops_analyzed)
    .sort((a, b) => b[1] - a[1])
    .map(([crop, count]) => ({
      name: crop,
      value: count,
    }));

  return (
    <div className="p-8 max-w-7xl mx-auto" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">Analytics Dashboard</h1>
        <p className="text-slate-600 font-secondary">Model performance and prediction statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-sm border-slate-200 stat-card" data-testid="total-predictions-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Total Predictions</p>
                <p className="text-3xl font-semibold text-slate-900">{stats.total_predictions}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-sm">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 stat-card" data-testid="avg-confidence-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Avg Confidence</p>
                <p className="text-3xl font-semibold text-slate-900">{(stats.avg_confidence * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-sm">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 stat-card" data-testid="recent-predictions-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Last 7 Days</p>
                <p className="text-3xl font-semibold text-slate-900">{stats.recent_predictions}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-sm">
                <BarChart3 className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 stat-card" data-testid="unique-diseases-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Unique Diseases</p>
                <p className="text-3xl font-semibold text-slate-900">{Object.keys(stats.disease_distribution).length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-sm">
                <Leaf className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Disease Distribution */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <CardTitle className="text-lg font-medium">Top 10 Diseases</CardTitle>
            <CardDescription className="text-sm">Most frequently diagnosed diseases</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={diseaseChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-45}
                  textAnchor="end"
                  height={120}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#064e3b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Crop Distribution */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <CardTitle className="text-lg font-medium">Crops Analyzed</CardTitle>
            <CardDescription className="text-sm">Distribution by crop type</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cropChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cropChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Disease List */}
      <Card className="shadow-sm border-slate-200 mt-6">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30">
          <CardTitle className="text-lg font-medium">All Detected Diseases</CardTitle>
          <CardDescription className="text-sm">Complete list of diagnosed conditions</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.disease_distribution)
              .sort((a, b) => b[1] - a[1])
              .map(([disease, count]) => (
                <Badge
                  key={disease}
                  variant="outline"
                  className="font-mono text-xs px-3 py-1 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  {disease.replace(/_/g, ' ')} ({count})
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;