import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Trash2, Search, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HistoryPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/records?limit=200`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await axios.delete(`${API}/records/${id}`);
      setRecords(records.filter((r) => r.id !== id));
      toast.success('Record deleted successfully');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    } finally {
      setDeleting(null);
    }
  };

  const filteredRecords = records.filter((record) => {
    const search = searchTerm.toLowerCase();
    return (
      record.predicted_disease.toLowerCase().includes(search) ||
      record.crop_type.toLowerCase().includes(search) ||
      record.location_region.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto" data-testid="history-page">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">Prediction History</h1>
        <p className="text-slate-600 font-secondary">View and manage all previous disease predictions</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">All Records</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  data-testid="search-input"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Badge variant="outline" className="font-mono">
                {filteredRecords.length} records
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No Records Found</h3>
              <p className="text-sm text-slate-500">
                {searchTerm ? 'Try a different search term' : 'No predictions have been made yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-mono text-xs">DATE</TableHead>
                    <TableHead className="font-mono text-xs">CROP</TableHead>
                    <TableHead className="font-mono text-xs">REGION</TableHead>
                    <TableHead className="font-mono text-xs">DIAGNOSIS</TableHead>
                    <TableHead className="font-mono text-xs">CONFIDENCE</TableHead>
                    <TableHead className="font-mono text-xs">AGE (DAYS)</TableHead>
                    <TableHead className="font-mono text-xs text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const isHealthy = record.predicted_disease === 'Healthy';
                    return (
                      <TableRow key={record.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                          {formatDate(record.timestamp)}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{record.crop_type}</TableCell>
                        <TableCell className="text-sm text-slate-600">{record.location_region}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${
                              isHealthy ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                            } font-medium text-xs whitespace-nowrap`}
                          >
                            {record.predicted_disease.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{(record.confidence * 100).toFixed(1)}%</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">{record.plant_age_days}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            data-testid={`delete-record-${record.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                            disabled={deleting === record.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleting === record.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryPage;