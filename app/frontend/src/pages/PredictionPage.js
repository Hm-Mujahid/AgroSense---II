import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertTriangle, Beaker } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CROPS = ['Tomato', 'Potato', 'Wheat', 'Rice', 'Corn', 'Cotton', 'Soybean', 'Pepper'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
const LEAF_COLORS = ['Dark_Green', 'Green', 'Light_Green', 'Yellow_Green', 'Yellow', 'Pale_Green', 'Brown'];
const NUTRIENTS = ['None', 'Nitrogen', 'Phosphorus', 'Potassium', 'Magnesium', 'Iron', 'Calcium'];

const PredictionPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    crop_type: '',
    plant_age_days: '',
    location_region: '',
    soil_ph: '',
    soil_moisture_pct: '',
    ambient_temperature_c: '',
    ambient_humidity_pct: '',
    leaf_color: '',
    lesion_present: 'false',
    lesion_count: '0',
    spot_size_mm: '0',
    nutrient_deficiency_signs: 'None',
  });

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Prepare data
      const payload = {
        ...formData,
        plant_age_days: parseInt(formData.plant_age_days),
        soil_ph: parseFloat(formData.soil_ph),
        soil_moisture_pct: parseFloat(formData.soil_moisture_pct),
        ambient_temperature_c: parseFloat(formData.ambient_temperature_c),
        ambient_humidity_pct: parseFloat(formData.ambient_humidity_pct),
        lesion_present: formData.lesion_present === 'true',
        lesion_count: parseInt(formData.lesion_count),
        spot_size_mm: parseFloat(formData.spot_size_mm),
      };

      // Get prediction
      const response = await axios.post(`${API}/predict`, payload);
      setResult(response.data);

      // Save to history
      await axios.post(`${API}/records`, {
        ...payload,
        predicted_disease: response.data.prediction,
        confidence: response.data.confidence,
      });

      toast.success('Prediction completed successfully');
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error('Prediction failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = result?.prediction === 'Healthy';
  const confidencePercent = result ? (result.confidence * 100).toFixed(1) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto" data-testid="prediction-page">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">
          Plant Disease Diagnosis
        </h1>
        <p className="text-slate-600 font-secondary">
          Enter plant observation data to receive disease prediction and treatment recommendations
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <CardTitle className="text-lg font-medium">Observation Input</CardTitle>
            <CardDescription className="text-sm">Fill in all required fields</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plant Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Plant Information</h3>
                <div className="form-grid">
                  <div className="space-y-2">
                    <Label htmlFor="crop_type" className="text-sm font-medium">Crop Type *</Label>
                    <Select value={formData.crop_type} onValueChange={(val) => handleChange('crop_type', val)}>
                      <SelectTrigger id="crop_type" data-testid="crop-type-select">
                        <SelectValue placeholder="Select crop" />
                      </SelectTrigger>
                      <SelectContent>
                        {CROPS.map((crop) => (
                          <SelectItem key={crop} value={crop}>
                            {crop}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plant_age" className="text-sm font-medium">Plant Age (days) *</Label>
                    <Input
                      id="plant_age"
                      data-testid="plant-age-input"
                      type="number"
                      min="1"
                      max="200"
                      required
                      value={formData.plant_age_days}
                      onChange={(e) => handleChange('plant_age_days', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">Location Region *</Label>
                  <Select value={formData.location_region} onValueChange={(val) => handleChange('location_region', val)}>
                    <SelectTrigger id="location" data-testid="location-select">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Environmental Factors */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Environmental Factors</h3>
                <div className="form-grid">
                  <div className="space-y-2">
                    <Label htmlFor="soil_ph" className="text-sm font-medium">Soil pH *</Label>
                    <Input
                      id="soil_ph"
                      data-testid="soil-ph-input"
                      type="number"
                      step="0.1"
                      min="4"
                      max="9"
                      required
                      value={formData.soil_ph}
                      onChange={(e) => handleChange('soil_ph', e.target.value)}
                      className="font-mono"
                      placeholder="6.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="soil_moisture" className="text-sm font-medium">Soil Moisture (%) *</Label>
                    <Input
                      id="soil_moisture"
                      data-testid="soil-moisture-input"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={formData.soil_moisture_pct}
                      onChange={(e) => handleChange('soil_moisture_pct', e.target.value)}
                      className="font-mono"
                      placeholder="45.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature" className="text-sm font-medium">Temperature (°C) *</Label>
                    <Input
                      id="temperature"
                      data-testid="temperature-input"
                      type="number"
                      step="0.1"
                      min="-10"
                      max="50"
                      required
                      value={formData.ambient_temperature_c}
                      onChange={(e) => handleChange('ambient_temperature_c', e.target.value)}
                      className="font-mono"
                      placeholder="25.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="humidity" className="text-sm font-medium">Humidity (%) *</Label>
                    <Input
                      id="humidity"
                      data-testid="humidity-input"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={formData.ambient_humidity_pct}
                      onChange={(e) => handleChange('ambient_humidity_pct', e.target.value)}
                      className="font-mono"
                      placeholder="65.0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Visual Observations */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Visual Observations</h3>
                <div className="form-grid">
                  <div className="space-y-2">
                    <Label htmlFor="leaf_color" className="text-sm font-medium">Leaf Color *</Label>
                    <Select value={formData.leaf_color} onValueChange={(val) => handleChange('leaf_color', val)}>
                      <SelectTrigger id="leaf_color" data-testid="leaf-color-select">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAF_COLORS.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lesion" className="text-sm font-medium">Lesions Present *</Label>
                    <Select value={formData.lesion_present} onValueChange={(val) => handleChange('lesion_present', val)}>
                      <SelectTrigger id="lesion" data-testid="lesion-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lesion_count" className="text-sm font-medium">Lesion Count</Label>
                    <Input
                      id="lesion_count"
                      data-testid="lesion-count-input"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.lesion_count}
                      onChange={(e) => handleChange('lesion_count', e.target.value)}
                      className="font-mono"
                      disabled={formData.lesion_present === 'false'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spot_size" className="text-sm font-medium">Spot Size (mm)</Label>
                    <Input
                      id="spot_size"
                      data-testid="spot-size-input"
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={formData.spot_size_mm}
                      onChange={(e) => handleChange('spot_size_mm', e.target.value)}
                      className="font-mono"
                      disabled={formData.lesion_present === 'false'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nutrient" className="text-sm font-medium">Nutrient Deficiency Signs</Label>
                  <Select
                    value={formData.nutrient_deficiency_signs}
                    onValueChange={(val) => handleChange('nutrient_deficiency_signs', val)}
                  >
                    <SelectTrigger id="nutrient" data-testid="nutrient-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NUTRIENTS.map((nutrient) => (
                        <SelectItem key={nutrient} value={nutrient}>
                          {nutrient}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                data-testid="analyze-button"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Beaker className="mr-2 h-4 w-4" />
                    Analyze Sample
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card className="shadow-sm border-slate-200 result-card">
                <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                  <CardTitle className="text-lg font-medium">Diagnosis Result</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Primary Result */}
                  <div className="text-center py-6 border-b border-slate-100">
                    <div className="mb-4">
                      {isHealthy ? (
                        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
                      ) : (
                        <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
                      )}
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                      {result.prediction.replace(/_/g, ' ')}
                    </h2>
                    <Badge
                      variant="outline"
                      className={`${isHealthy ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} font-mono`}
                    >
                      {confidencePercent}% Confidence
                    </Badge>
                  </div>

                  {/* Confidence Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">Confidence Level</span>
                      <span className="font-mono text-slate-900">{confidencePercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-sm h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Treatment Information */}
              {result.treatment && (
                <Card className="shadow-sm border-slate-200 result-card">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                    <CardTitle className="text-lg font-medium">Treatment Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Tabs defaultValue="treatment" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="treatment">Treatment</TabsTrigger>
                        <TabsTrigger value="chemicals">Chemicals</TabsTrigger>
                        <TabsTrigger value="prevention">Prevention</TabsTrigger>
                      </TabsList>

                      <TabsContent value="treatment" className="space-y-3">
                        <p className="text-sm text-slate-700 leading-relaxed">{result.treatment.treatment}</p>
                      </TabsContent>

                      <TabsContent value="chemicals" className="space-y-3">
                        {result.treatment.chemicals.length > 0 ? (
                          <ul className="space-y-2">
                            {result.treatment.chemicals.map((chemical, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span className="text-sm text-slate-700">{chemical}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-500 italic">No chemical treatment required</p>
                        )}
                      </TabsContent>

                      <TabsContent value="prevention" className="space-y-3">
                        <p className="text-sm text-slate-700 leading-relaxed">{result.treatment.prevention}</p>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="shadow-sm border-slate-200 border-dashed">
              <CardContent className="p-12 text-center">
                <Beaker className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">No Analysis Yet</h3>
                <p className="text-sm text-slate-500">Fill in the form and submit to get diagnosis results</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;