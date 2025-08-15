# Bresolin Imóveis - Real Estate Management System
A comprehensive real estate management platform built with Flask and PostgreSQL, featuring property listings, advanced search capabilities, and an administrative dashboard.

## 1. ABOUT THE DATABASE
### 1.1 Database Technology
- Primary Database : PostgreSQL 16
- ORM : SQLAlchemy with raw SQL queries
- Connection Pool : psycopg2-binary for PostgreSQL connectivity
- Environment : Supports both local development and production deployment
### 1.2 Database Schema
The system uses four main tables:
 1.2.1 Properties Table ( imoveis )
- Primary Key : id (auto-increment)
- Core Fields : title, description, price, image, type, purpose (sale/rent)
- Property Details : bedrooms, suites, bathrooms, parking spaces, area
- Location : address, neighborhood, city, state (UF)
- Status Fields : active/inactive, featured properties
- Additional Features : pool, barbecue area, delivery date, construction stage
- Financial : IPTU tax, condominium fees 1.2.2 Property Images Table ( imagens_imovel )
- Types : Main image, secondary images, floor plans
- Foreign Key : Links to properties table
- Cascade Delete : Images are automatically removed when property is deleted 1.2.3 Condominiums Table ( condominios )
- Details : Name, description, location, construction stage
- Specifications : Total units, floors, slab area
- Timeline : Launch date, delivery date
- Documentation : RI (Internal Regulations), IPTU information 1.2.4 Access Tracking Table ( acessos )
- Purpose : Analytics and visitor tracking
- Data : Property ID, timestamp
- Usage : Track property views and general site visits
### 1.3 Database Configuration
- Local Development : SSH tunnel to remote PostgreSQL server
- Production : Direct PostgreSQL connection
- Docker Support : PostgreSQL container for local development
- Environment Variables : Database credentials stored in .env file
## 2. BACKEND ARCHITECTURE
### 2.1 Technology Stack
- Framework : Flask (Python web framework)
- Database : PostgreSQL with SQLAlchemy
- Authentication : Basic HTTP authentication for admin routes
- File Handling : Werkzeug for secure file uploads
- Environment Management : python-dotenv for configuration
## 2.2 Application Structure
### 2.2.1 File Organization
```
backend/
├── app.py                    # 
Main Flask application
├── criar_banco.py           # 
Database schema creation script
├── relatorio_semanal.py     # 
Weekly reporting system
├── requirements.txt         # 
Python dependencies
├── Dockerfile              # 
Container configuration
├── .env                    # 
Environment variables (not tracked)
├── .env.example           # 
Configuration example
├── static/                # Static 
files
│   ├── css/              # 
Stylesheets
│   ├── js/               # 
JavaScript files
│   ├── img/              # Images 
and icons
│   │   └── uploads/      # 
Property image uploads
│   └── fonts/            # Custom 
fonts
└── templates/            # HTML 
templates
    ├── index.html        # Homepage
    ├── pesquisa.html     # Search 
    page
    ├── imovel.html       # 
    Property details
    ├── dashboard.html    # 
    Administrative panel
    ├── editar_imovel.html # 
    Property editor
    ├── admin.html        # Admin 
    interface
    └── partials/         # 
    Reusable components
        └── card_imovel.html
```
### 2.2.2 Core Components Main Application ( app.py )
- Configuration : Flask initialization and PostgreSQL connection
- Routing : Definition of all public and administrative routes
- Authentication : Protection system for administrative routes
- APIs : RESTful endpoints for property and image CRUD operations
- Middleware : Upload handling and validations Auxiliary Scripts
- criar_banco.py : Initial database table creation
- relatorio_semanal.py : Access and performance report generation Static Files
- CSS : Responsive styles and visual components
- JavaScript : Dynamic interactions and frontend validations
- Images : Icons, logos, and property uploads
- Fonts : Custom brand typography HTML Templates
- Public Pages : Homepage, search, and property details
- Administrative Area : Dashboard and property editor
- Components : Reusable cards and partials
### 2.2.3 Data Flow
1. 1.
   Request : Client accesses route via browser
2. 2.
   Authentication : Credential verification (if protected route)
3. 3.
   Processing : Business logic and database queries
4. 4.
   Rendering : Template engine processes HTML with data
5. 5.
   Response : Complete page or JSON data returned
### 2.3 Core Features 2.3.1 Property Management
- CRUD Operations : Create, read, update, delete properties
- Image Management : Multiple images per property with type classification
- Status Control : Activate/deactivate properties
- Featured Properties : Highlight up to 6 properties on homepage 2.3.2 Search and Filtering
- Advanced Search : Multiple filter criteria
- Text Search : Unaccented search across multiple fields
- Autocomplete : Real-time suggestions for locations and IDs
- Similar Properties : Algorithm to suggest related properties 2.3.3 Administrative Panel
- Protected Routes : HTTP Basic Authentication
- Property Editor : Full CRUD interface for properties
- Image Upload : Direct image management
- Analytics : Access tracking and reporting
### 2.4 API Endpoints 2.4.1 Public Routes
- GET / - Homepage with featured properties
- GET /pesquisa - Property search with filters
- GET /imovel/<id> - Individual property details
- GET /api/sugestoes - Search autocomplete suggestions 2.4.2 Protected Admin Routes
- GET /admin - Administrative dashboard
- GET /admin/imovel/<id>/editar - Property edit interface
- POST /api/imoveis/destaque - Set featured properties 2.4.3 API Routes
- GET|POST /api/imoveis - List or create properties
- GET|PUT|DELETE /api/imoveis/<id> - Property CRUD operations
- POST /api/imoveis/<id>/toggle - Toggle property status
- GET|POST /api/imoveis/<id>/imagens - Property image management
- DELETE /api/imagens/<id> - Delete specific image
- GET|POST /api/condominios - Condominium management
## 3. FRONTEND ARCHITECTURE
### 3.1 Technology Stack
- Template Engine : Jinja2 (Flask's default)
- Styling : Custom CSS with responsive design
- JavaScript : jQuery for dynamic interactions
- Icons : Custom SVG icons and external icon libraries
### 3.2 User Interface Components 3.2.1 Homepage ( index.html )
- Hero Section : Property search form with filters
- Featured Properties : Dynamic loading of highlighted properties
- Loading Animation : Custom SVG house icon animation
- Contact Information : Footer with realtor details 3.2.2 Property Search ( pesquisa.html )
- Advanced Filters : Type, location, price, amenities
- Results Display : Grid layout with property cards
- Pagination : Efficient handling of large result sets 3.2.3 Property Details ( imovel.html )
- Image Gallery : Multiple property images with navigation
- Detailed Information : All property specifications
- Similar Properties : Related property suggestions
- Contact Integration : WhatsApp and phone contact options 3.2.4 Administrative Interface
- Dashboard : Property management overview
- Property Editor : Form-based property editing
- Image Manager : Upload and organize property images
### 3.3 Responsive Design
- Mobile-First : Optimized for mobile devices
- Progressive Enhancement : Works without JavaScript
- Touch-Friendly : Large buttons and touch targets
- Performance : Optimized images and minimal JavaScript
## 4. DEPLOYMENT AND INFRASTRUCTURE
### 4.1 Containerization 4.1.1 Docker Configuration
- Application Container : Flask app with Gunicorn
- Database Container : PostgreSQL 16
- Volume Management : Persistent data storage
- Network : Internal container communication 4.1.2 Docker Compose Services
```
services:
  bresolin_app:     # Flask 
  application
  bresolin_db:      # PostgreSQL 
  database
```
### 4.2 CI/CD Pipeline 4.2.1 GitHub Actions Workflow
- Trigger : Push to main branch
- Deployment : Automated VPS deployment
- Database Backup : Automatic backup before deployment
- Zero Downtime : Rolling deployment strategy 4.2.2 Deployment Process
1. 1.
   Backup : Create database dump
2. 2.
   Update : Pull latest code from repository
3. 3.
   Build : Rebuild Docker containers
4. 4.
   Deploy : Start updated services
### 4.3 Environment Configuration 4.3.1 Environment Variables
- Database : Connection strings and credentials
- Authentication : Admin username and password
- External Services : API keys and configurations 4.3.2 Security Measures
- Sensitive Data : Excluded from version control
- Example Files : Template configurations provided
- SSH Access : Secure server communication
## 5. SECURITY IMPLEMENTATION
### 5.1 Authentication and Authorization
- Admin Protection : HTTP Basic Authentication
- Route Security : Decorator-based protection
- Credential Management : Environment-based configuration
### 5.2 Data Protection
- Input Validation : SQL injection prevention
- File Security : Secure filename handling
- Environment Isolation : Separate development/production configs
### 5.3 Version Control Security
- Gitignore : Sensitive files excluded
- Example Files : Safe configuration templates
- SSH Keys : Secure deployment authentication
## 6. DEVELOPMENT WORKFLOW
### 6.1 Local Development Setup
 1.
   Clone Repository : git clone <repository-url>
2.
   Environment Setup : Copy .env.example to .env
3.
   Database : Configure PostgreSQL connection
4.
   Dependencies : pip install -r requirements.txt
5.
   Run Application : python app.py
### 6.2 Database Management
- Schema Creation : Run criar_banco.py for initial setup
- Migrations : Manual SQL updates as needed
- Backups : Automated and manual backup procedures
### 6.3 Code Organization
- Modular Structure : Separated concerns and components
- Template Inheritance : Reusable HTML components
- Static Assets : Organized CSS, JS, and images
## 7. FEATURES AND FUNCTIONALITY
### 7.1 Property Management
- Comprehensive Listings : Detailed property information
- Image Galleries : Multiple images per property
- Status Management : Active/inactive property control
- Featured Properties : Homepage highlighting system
### 7.2 Search Capabilities
- Multi-Criteria Search : Location, type, price, amenities
- Intelligent Matching : Unaccented text search
- Autocomplete : Real-time search suggestions
- Similar Properties : Related property recommendations
### 7.3 User Experience
- Responsive Design : Mobile and desktop optimization
- Fast Loading : Optimized performance
- Contact Integration : Direct WhatsApp and phone links
- Analytics : Visitor and property view tracking
### 7.4 Administrative Tools
- Property CRUD : Complete property management
- Image Management : Upload and organize property images
- Analytics Dashboard : Access tracking and reporting
- Bulk Operations : Efficient property status management
## 8. TECHNICAL SPECIFICATIONS
### 8.1 System Requirements
- Python : 3.8+
- PostgreSQL : 16+
- Docker : Latest stable version
- Memory : Minimum 512MB RAM
- Storage : Depends on image uploads
### 8.2 Performance Considerations
- Database Indexing : Optimized query performance
- Image Optimization : Efficient storage and delivery
- Caching : Static asset caching
- Connection Pooling : Database connection management
### 8.3 Scalability
- Horizontal Scaling : Docker container deployment
- Database Scaling : PostgreSQL replication support
- Load Balancing : Multiple application instances
- CDN Integration : Static asset delivery optimization
## 9. MAINTENANCE AND MONITORING
### 9.1 Backup Strategy
- Automated Backups : Daily database dumps
- Deployment Backups : Pre-deployment safety
- Image Backups : Static file preservation
### 9.2 Monitoring
- Access Logs : User interaction tracking
- Error Logging : Application error monitoring
- Performance Metrics : Response time tracking
### 9.3 Updates and Maintenance
- Dependency Updates : Regular security updates
- Database Maintenance : Performance optimization
- Content Management : Property data updates