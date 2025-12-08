# Deployment Guide - Plant Disease Detector

This guide covers deploying the Plant Disease Detector application to various environments.

## Quick Start (Current Environment)

The application is already running in the current environment:

- **Backend**: Running on port 8001 (via supervisor)
- **Frontend**: Running on port 3000 (via supervisor)
- **MongoDB**: Running on localhost:27017
- **Access**: Via the provided preview URL

### Current Status Check
```bash
# Check service status
sudo supervisorctl status

# Check backend logs
tail -f /var/log/supervisor/backend.*.log

# Check frontend logs
tail -f /var/log/supervisor/frontend.*.log
```

### Restart Services
```bash
# Restart both services
sudo supervisorctl restart backend frontend

# Restart individual service
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

## Local Development Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB 4.4+
- Yarn 1.22+

### Step-by-Step Setup

1. **Clone and Setup**
```bash
cd /app

# Backend setup
cd backend
pip install -r requirements.txt

# Frontend setup
cd ../frontend
yarn install
```

2. **Generate Data and Train Model**
```bash
cd /app/backend

# Generate initial dataset (800 samples)
python dataset.py

# Train the model
python train.py

# Optional: Expand to 10k samples
python augment_data.py
python train.py  # Retrain with larger dataset
```

3. **Configure Environment**

Backend (`.env`):
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="plant_disease_db"
CORS_ORIGINS="http://localhost:3000"
```

Frontend (`.env`):
```bash
REACT_APP_BACKEND_URL=http://localhost:8001
```

4. **Start Services**

Terminal 1 (Backend):
```bash
cd /app/backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Terminal 2 (Frontend):
```bash
cd /app/frontend
yarn start
```

5. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api
- API Docs: http://localhost:8001/docs

## MongoDB Setup

### Using MongoDB Compass

1. **Download**: https://www.mongodb.com/products/compass
2. **Connect**: `mongodb://localhost:27017`
3. **Create Database**: `plant_disease_db`
4. **Collections**: Auto-created on first use

### Import Sample Data
```bash
# Restore from backup
mongorestore --db plant_disease_db /app/mongodb_backup/test_database

# Verify
mongo plant_disease_db --eval "db.predictions.countDocuments()"
```

### Export Data
```bash
# Export entire database
mongodump --db plant_disease_db --out /path/to/backup

# Export specific collection
mongoexport --db plant_disease_db --collection predictions --out predictions.json

# Export as CSV
mongoexport --db plant_disease_db --collection predictions --type=csv --fields=crop_type,predicted_disease,confidence --out predictions.csv
```

## Docker Deployment

### Create Dockerfile

**Backend Dockerfile** (`/app/backend/Dockerfile`):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8001

# Run application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Frontend Dockerfile** (`/app/frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy application
COPY . .

# Build
RUN yarn build

# Serve with simple server
RUN npm install -g serve
EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
```

### Docker Compose

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: plant-disease-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: plant_disease_db

  backend:
    build: ./backend
    container_name: plant-disease-backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=plant_disease_db
      - CORS_ORIGINS=http://localhost:3000
    depends_on:
      - mongodb
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    container_name: plant-disease-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    depends_on:
      - backend

volumes:
  mongo-data:
```

### Run with Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Production Deployment

### Environment Variables

**Backend (Production)**:
```bash
MONGO_URL="mongodb://user:password@host:27017/dbname?authSource=admin"
DB_NAME="plant_disease_db"
CORS_ORIGINS="https://yourdomain.com"
```

**Frontend (Production)**:
```bash
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

### Security Considerations

1. **MongoDB**:
   - Enable authentication
   - Use strong passwords
   - Restrict network access
   - Enable SSL/TLS

2. **Backend API**:
   - Use HTTPS in production
   - Implement rate limiting
   - Add API authentication
   - Enable CORS restrictions

3. **Secrets Management**:
   - Use environment variables
   - Never commit .env files
   - Use secret management tools (AWS Secrets Manager, HashiCorp Vault)

### Nginx Configuration

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/plant-disease/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Cloud Deployment

### AWS

**Architecture**:
- EC2: Application servers
- DocumentDB: MongoDB-compatible database
- S3: Static assets and backups
- CloudFront: CDN for frontend
- Route 53: DNS management

**Steps**:
1. Launch EC2 instance
2. Setup DocumentDB cluster
3. Deploy application via Docker
4. Configure security groups
5. Setup CloudFront distribution

### Google Cloud Platform

**Architecture**:
- Cloud Run: Containerized applications
- MongoDB Atlas: Managed database
- Cloud Storage: Backups
- Cloud CDN: Content delivery

**Steps**:
1. Containerize application
2. Push to Container Registry
3. Deploy to Cloud Run
4. Connect to MongoDB Atlas
5. Setup Cloud CDN

### Heroku

**Quick Deploy**:
```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create plant-disease-detector

# Add MongoDB addon
heroku addons:create mongolab

# Deploy
git push heroku main

# Set environment variables
heroku config:set REACT_APP_BACKEND_URL=https://plant-disease-detector.herokuapp.com
```

## Performance Optimization

### Backend

1. **Caching**:
```python
# Add Redis caching for predictions
from redis import Redis
cache = Redis(host='localhost', port=6379)

# Cache frequent predictions
cache.setex(f"pred:{input_hash}", 3600, prediction_json)
```

2. **Database Indexing**:
```javascript
// MongoDB indexes
db.predictions.createIndex({ "timestamp": -1 })
db.predictions.createIndex({ "crop_type": 1, "predicted_disease": 1 })
db.predictions.createIndex({ "confidence": -1 })
```

3. **Model Loading**:
- Load model once at startup (already implemented)
- Use model versioning
- Implement model warm-up

### Frontend

1. **Build Optimization**:
```bash
# Production build
yarn build

# Analyze bundle size
yarn add -D webpack-bundle-analyzer
```

2. **Code Splitting**:
```javascript
// Lazy load pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
```

3. **Image Optimization**:
- Use WebP format
- Lazy load images
- Implement CDN

## Monitoring and Logging

### Application Monitoring

**Backend Logging**:
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

**Health Check Endpoint**:
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model_data is not None,
        "db_connected": await check_db_connection()
    }
```

### Monitoring Tools

- **Application**: New Relic, Datadog
- **Infrastructure**: Prometheus, Grafana
- **Logs**: ELK Stack, Splunk
- **Uptime**: UptimeRobot, Pingdom

## Backup Strategy

### Database Backup

**Automated Backup Script**:
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# MongoDB backup
mongodump --db plant_disease_db --out $BACKUP_DIR/mongo_$DATE

# Compress
tar -czf $BACKUP_DIR/mongo_$DATE.tar.gz $BACKUP_DIR/mongo_$DATE
rm -rf $BACKUP_DIR/mongo_$DATE

# Delete old backups (keep last 7 days)
find $BACKUP_DIR -name "mongo_*.tar.gz" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/mongo_$DATE.tar.gz s3://your-bucket/backups/
```

**Cron Job**:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Model Versioning

```bash
# Version models with timestamp
MODEL_VERSION=$(date +%Y%m%d_%H%M%S)
cp models/plant_disease_model.joblib models/plant_disease_model_$MODEL_VERSION.joblib
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
```bash
# Find process using port
lsof -i :8001
# Kill process
kill -9 <PID>
```

2. **MongoDB Connection Failed**:
```bash
# Check MongoDB status
sudo systemctl status mongod
# Restart MongoDB
sudo systemctl restart mongod
```

3. **Model Not Loading**:
```bash
# Verify model file exists
ls -lh /app/backend/models/plant_disease_model.joblib
# Retrain if missing
cd /app/backend && python train.py
```

4. **Frontend Build Errors**:
```bash
# Clear cache and rebuild
rm -rf node_modules yarn.lock
yarn install
yarn build
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Distribute traffic across multiple instances
2. **Stateless Design**: Store sessions in Redis
3. **Database Sharding**: Partition MongoDB data
4. **Microservices**: Split into separate services

### Vertical Scaling

1. **Increase Resources**: More CPU/RAM for instances
2. **Database Optimization**: Indexes, query optimization
3. **Model Optimization**: Quantization, pruning

## Maintenance

### Regular Tasks

**Daily**:
- Check application logs
- Monitor error rates
- Verify backups completed

**Weekly**:
- Review system metrics
- Update dependencies
- Clean old records

**Monthly**:
- Retrain model with new data
- Security updates
- Performance review

### Update Process

1. **Test in Staging**:
```bash
# Deploy to staging
git checkout staging
git pull origin main
# Test thoroughly
```

2. **Deploy to Production**:
```bash
# Create release tag
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0

# Deploy
git checkout production
git merge v1.1.0
```

3. **Monitor**:
- Watch error logs
- Check performance metrics
- Verify functionality

## Support

For deployment issues:
1. Check logs: `/var/log/supervisor/`
2. Review environment variables
3. Verify service status
4. Check MongoDB connection
5. Test API endpoints

---

**Last Updated**: December 2025  
**Version**: 1.0.0
