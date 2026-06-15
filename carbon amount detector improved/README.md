# EcoFootprint - Carbon Footprint Tracker

An ultra-efficient, secure, and responsive web application designed to help individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

---

## Key Features

1. **Carbon Footprint Calculator**: Quickly estimate emissions across **Home Energy**, **Transportation**, **Dietary Choices**, and **Waste & Consumption**.
2. **Interactive Dashboard**: View category breakdowns using custom, lightweight SVG donut charts.
3. **Daily Action Tracker**: Check off eco-friendly tasks (e.g., cycling, vegan meals) to log cumulative daily carbon savings against a monthly savings goal.
4. **Personalized Insights**: Automatically displays constructive recommendations based on your highest emission categories.
5. **Data Portability**: Import and export your data as a clean JSON backup file. All data remains saved locally in your browser (`localStorage`) for absolute privacy.

---

## Local Setup & Development

Verify you have **Node.js** (v18+) installed.

### 1. Install Dependencies
Installs only standard required dependencies (`express`, `helmet`, `express-rate-limit`):
```bash
npm install
```

### 2. Run the Server
Starts the Express server in production configuration:
```bash
npm start
```
The application will be accessible at: `http://localhost:8080`

### 3. Run Automated Unit Tests
Runs the native Node.js test runner (zero external dependencies required):
```bash
npm test
```

---

## Push to GitHub Repository

Open your terminal in the root directory and execute the following commands to host your project on GitHub:

```bash
# 1. Initialize local Git repository
git init

# 2. Add all project files
git add .

# 3. Create initial commit
git commit -m "feat: initialize carbon footprint tracker application"

# 4. Rename primary branch to main
git branch -M main

# 5. Link to your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/carbon-footprint-tracker.git

# 6. Push code to remote
git push -u origin main
```

---

## Google Cloud Run Deployment

Google Cloud Run runs your application inside a secure, autoscaling Docker container.

### Option A: Deployment via Google Cloud Console (Web GUI)
If you prefer deploying directly via the web browser:

1. Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Search for and select **Cloud Run**.
3. Click **Create Service**.
4. Choose **"Deploy one revision from an existing container image"** or select **"Continuously deploy new revisions from a source repository"** (connects directly to your GitHub repo created above).
5. If selecting **GitHub Connection**:
   - Authenticate with your GitHub account.
   - Select your `carbon-footprint-tracker` repository.
   - Click **Next**.
   - Under Build configuration, select **Dockerfile** (the Dockerfile is already included in the root directory).
6. Under **Service Settings**:
   - Enter your Service name (e.g., `carbon-tracker`).
   - Select your preferred region (e.g., `us-central1`).
7. Under **Authentication**:
   - Check **"Allow unauthenticated invocations"** (so the public can access your web app).
8. Under **Container, Connections, Security** (Expand accordion):
   - Ensure the Container port is set to `8080` (Cloud Run maps external traffic to this port inside our container).
9. Click **Create**. Google Cloud will build your Docker container, spin it up, and provide a secure HTTPS URL for your app.

### Option B: Deployment via Google Cloud SDK (CLI)
If you have the `gcloud` CLI tool installed, run these commands:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login

# 2. Set your active Google Cloud project ID
gcloud config set project YOUR_PROJECT_ID

# 3. Build your Docker image using Cloud Build (no local Docker engine needed)
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/carbon-tracker

# 4. Deploy the image to Cloud Run
gcloud run deploy carbon-tracker \
  --image gcr.io/YOUR_PROJECT_ID/carbon-tracker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

## Architecture & Security Highlights

- **Resource Efficiency**: Standard React or Next.js apps create huge bundles (often exceeding 50MB) and long load times. This app uses vanilla frontend files served by Express. The entire project transfers in less than 50KB, reducing CPU overhead and memory footprint to nearly zero.
- **Vulnerability Mitigations**:
  - **Helmet Headers**: Configured Content Security Policy (CSP), X-XSS-Protection, and Frameguard to block script injection and clickjacking.
  - **API Rate Limiter**: Express-rate-limit prevents brute force requests or spamming endpoints.
  - **Input Verification**: Custom server-side validator restricts maximum ranges to prevent Denial-of-Service and data-type corruption.
  - **Docker Security**: The Dockerfile runs under a non-root `node` system user to prevent container escaping.
