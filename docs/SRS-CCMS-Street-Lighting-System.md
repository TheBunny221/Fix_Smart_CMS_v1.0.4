# Software Requirements Specification (SRS)
## CCMS Street Lighting Complaint Management System

**Version:** 1.0  
**Date:** November 2024  
**Project:** Cochin Smart City - Street Lighting Management  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features](#3-system-features)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [System Architecture](#5-system-architecture)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Database Design](#7-database-design)
8. [Appendices](#8-appendices)

---

## 1. Introduction

### 1.1 Purpose

This document outlines the Software Requirements Specification (SRS) for a CCMS Street Lighting Complaint Management System, a crucial component of the Cochin Smart City project. This dedicated application provides a centralized platform for citizens to report issues related to the smart lighting system, enabling quick response to complaints, assignment to relevant teams for immediate attention, and ensuring timely resolution.

### 1.2 Scope

The Complaint Management System (CMS) will allow citizens, administrators, and maintenance teams to log, track, and resolve complaints efficiently. The system supports:

- **Multi-user Role Management**: Citizens, Ward Officers, Maintenance Teams, and Administrators
- **Multilingual Capabilities**: Malayalam, Hindi, and English
- **Real-time Notifications**: Email-based status updates
- **Comprehensive Tracking**: From complaint registration to resolution
- **Analytics and Reporting**: Performance monitoring and trend analysis

### 1.3 Definitions, Acronyms, and Abbreviations

- **CMS**: Complaint Management System
- **CCMS**: Cochin City Municipal Corporation Smart City
- **OTP**: One-Time Password
- **API**: Application Programming Interface
- **UI**: User Interface
- **SRS**: Software Requirements Specification

### 1.4 References

- Cochin Smart City Project Documentation
- Municipal Corporation Guidelines
- Smart City Mission Standards

---

## 2. Overall Description

### 2.1 Product Perspective

The CMS is a critical component of the larger Cochin Smart Lighting Project. It serves as a bridge connecting citizens with administrative and maintenance workflows to ensure timely and effective complaint resolution. The system integrates with existing municipal infrastructure while providing a modern, accessible interface for all stakeholders.

### 2.2 Product Functions

The system provides the following core functions:

1. **Complaint Registration**
   - Web-based complaint submission
   - Mobile-responsive interface
   - Photo upload capability
   - Geolocation capture

2. **Complaint Status Tracking**
   - Real-time status updates
   - User notifications via email
   - Historical complaint viewing

3. **Assignment Management**
   - Ward Officer assignment capabilities
   - Maintenance team allocation
   - Departmental routing

4. **Administrative Dashboard**
   - System-wide issue monitoring
   - Performance analytics
   - User management

5. **Role-based Access Control**
   - Secure authentication
   - Permission-based functionality
   - Multi-level user hierarchy

6. **Reporting and Analytics**
   - Complaint density heatmaps
   - Trend analysis (daily/weekly/monthly)
   - Performance metrics

### 2.3 Language Capabilities

The system supports three languages:
- **Malayalam** (Primary local language)
- **Hindi** (National language)
- **English** (Administrative and technical communication)

### 2.4 User Characteristics

#### 2.4.1 Citizens
- **Access Level**: Basic user
- **Capabilities**: 
  - Lodge complaints via web interface
  - Track complaint status
  - View complaint history
- **Authentication**: Mobile number and Email with OTP verification

#### 2.4.2 Ward Officers
- **Access Level**: Administrative user
- **Capabilities**:
  - Create complaints on behalf of citizens
  - Assign complaints to Maintenance Teams
  - Review and monitor complaint status
  - Generate ward-level reports

#### 2.4.3 Maintenance Teams
- **Access Level**: Field user
- **Capabilities**:
  - View assigned complaints
  - Update complaint status (In Progress, Resolved)
  - Create new complaints if discovered during field work
  - Upload resolution photos and notes

#### 2.4.4 Administrators
- **Access Level**: System administrator
- **Capabilities**:
  - Oversee complete system usage
  - Generate comprehensive reports
  - Manage user accounts and permissions
  - Create and manage complaint types
  - Create and manage zones and sub-zones
  - Close and reopen complaints
  - System configuration and maintenance

---

## 3. System Features

### 3.1 User Registration and Authentication

#### 3.1.1 Description
Secure user registration and login system supporting multiple user roles with appropriate access controls.

#### 3.1.2 Functional Requirements

**FR-1.1**: The system shall provide secure login for citizens, ward officers, maintenance teams, and administrators.

**FR-1.2**: The system shall implement OTP-based verification for citizens using email addresses.

**FR-1.3**: The system shall support role-based access control with appropriate permissions for each user type.

**FR-1.4**: The system shall maintain user session security with automatic timeout features.

### 3.2 Complaint Submission

#### 3.2.1 Description
Comprehensive complaint submission system allowing users to report street lighting issues with detailed information.

#### 3.2.2 Functional Requirements

**FR-2.1**: The system shall provide complaint type selection including:
- Light not working
- Flickering light
- Pole damaged
- Wiring issues
- Other (with description field)

**FR-2.2**: The system shall capture complaint details including:
- Description field (mandatory)
- Geolocation coordinates (automatic/manual)
- Photo upload capability (multiple images)
- Contact information
- Preferred language for communication

**FR-2.3**: The system shall automatically assign unique complaint IDs for tracking purposes.

**FR-2.4**: The system shall validate all required fields before complaint submission.

### 3.3 Complaint Tracking and Management

#### 3.3.1 Description
Comprehensive tracking system for monitoring complaint lifecycle from registration to resolution.

#### 3.3.2 Complaint Status Workflow

The system shall support the following status progression:

1. **Registered**: Initial complaint submission
2. **Assigned**: Allocated to Ward Officer/Maintenance Team
3. **In Progress**: Work initiated by Maintenance Team
4. **Resolved**: Issue fixed by Maintenance Team
5. **Closed**: Verified and closed by Administrator

#### 3.3.3 Functional Requirements

**FR-3.1**: Citizens shall be able to view history and status of all complaints logged by them.

**FR-3.2**: Ward Officers shall be able to view, assign, and update complaints within their jurisdiction.

**FR-3.3**: Maintenance Teams shall be able to update complaint status and add resolution notes.

**FR-3.4**: Administrators shall have reopen and close functionality for all complaints.

**FR-3.5**: The system shall maintain complete audit trail of all status changes with timestamps and user information.

### 3.4 Notification System

#### 3.4.1 Description
Automated notification system to keep users informed about complaint status changes.

#### 3.4.2 Functional Requirements

**FR-4.1**: The system shall send email notifications on complaint status changes.

**FR-4.2**: The system shall support multilingual notifications based on user preferences.

**FR-4.3**: The system shall provide notification templates for different status changes.

### 3.5 Reporting and Analytics

#### 3.5.1 Description
Comprehensive reporting system providing insights into complaint patterns and system performance.

#### 3.5.2 Functional Requirements

**FR-5.1**: The system shall generate heatmaps showing complaint density across different areas.

**FR-5.2**: The system shall provide trend analysis with daily, weekly, and monthly views.

**FR-5.3**: The system shall generate performance reports including:
- Average resolution time
- Complaint volume by type
- Team performance metrics
- Geographic distribution analysis

**FR-5.4**: The system shall support data export in common formats (PDF, Excel, CSV).

### 3.6 User Profile Management

#### 3.6.1 Description
User profile management system allowing users to maintain their account information and preferences.

#### 3.6.2 Functional Requirements

**FR-6.1**: Users shall be able to view and edit their profile information.

**FR-6.2**: Users shall be able to change passwords with proper validation.

**FR-6.3**: Users shall be able to set language and notification preferences.

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 Web Interface
- **Responsive Design**: Compatible with desktop, tablet, and mobile devices
- **Accessibility**: WCAG 2.1 AA compliance
- **Multilingual Support**: Dynamic language switching
- **Intuitive Navigation**: Role-based menu systems

#### 4.1.2 Dashboard Interfaces
- **Citizen Dashboard**: Personal complaint tracking and submission
- **Ward Officer Dashboard**: Area-specific complaint management
- **Maintenance Dashboard**: Work assignment and status updates
- **Admin Dashboard**: System-wide monitoring and management

### 4.2 Hardware Interfaces

#### 4.2.1 Server Requirements
- **Web Server**: Node.js application server
- **Database Server**: PostgreSQL database system
- **File Storage**: Local/cloud storage for images and documents

#### 4.2.2 Client Requirements
- **Web Browser**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile Devices**: iOS and Android compatibility
- **Network**: Internet connectivity for real-time features

### 4.3 Software Interfaces

#### 4.3.1 Database Interface
- **Primary Database**: PostgreSQL with Prisma ORM
- **Data Migration**: Automated migration scripts
- **Backup System**: Regular automated backups

#### 4.3.2 Email Service Interface
- **SMTP Integration**: Email notification delivery
- **Template System**: Multilingual email templates
- **Delivery Tracking**: Email delivery status monitoring

### 4.4 Communication Interfaces

#### 4.4.1 API Interfaces
- **RESTful APIs**: Standard HTTP-based communication
- **Authentication**: JWT-based secure authentication
- **Rate Limiting**: API usage control and monitoring

---

## 5. System Architecture

### 5.1 Overall Architecture

The system follows a modern web application architecture with the following components:

#### 5.1.1 Frontend Architecture
- **Technology**: React.js with TypeScript
- **Styling**: Tailwind CSS with responsive design
- **State Management**: Redux Toolkit for application state
- **Routing**: React Router for navigation
- **Internationalization**: i18next for multilingual support

#### 5.1.2 Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: JavaScript/TypeScript
- **Architecture Pattern**: RESTful API with modular structure
- **Authentication**: JWT-based authentication system
- **File Upload**: Multer for image and document handling

#### 5.1.3 Database Architecture
- **Database**: PostgreSQL relational database
- **ORM**: Prisma for database operations and migrations
- **Connection Pooling**: Optimized database connections
- **Indexing**: Strategic indexing for performance optimization

### 5.2 Deployment Architecture

#### 5.2.1 Production Environment
- **Application Server**: PM2 process manager
- **Web Server**: Nginx reverse proxy (recommended)
- **SSL/TLS**: HTTPS encryption for secure communication
- **Monitoring**: Application and system monitoring tools

#### 5.2.2 Development Environment
- **Development Server**: Vite development server
- **Hot Reload**: Real-time code updates during development
- **Testing**: Vitest for unit and integration testing
- **Code Quality**: ESLint and TypeScript for code validation

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements

**NFR-1.1**: The system shall support concurrent access by up to 1000 users.

**NFR-1.2**: Page load times shall not exceed 3 seconds under normal network conditions.

**NFR-1.3**: Database queries shall execute within 2 seconds for standard operations.

**NFR-1.4**: The system shall handle file uploads up to 10MB per image.

### 6.2 Security Requirements

**NFR-2.1**: All user passwords shall be encrypted using industry-standard hashing algorithms.

**NFR-2.2**: The system shall implement HTTPS encryption for all data transmission.

**NFR-2.3**: User sessions shall timeout after 30 minutes of inactivity.

**NFR-2.4**: The system shall log all security-related events for audit purposes.

**NFR-2.5**: Role-based access control shall prevent unauthorized access to system functions.

### 6.3 Reliability Requirements

**NFR-3.1**: The system shall maintain 99.5% uptime during business hours.

**NFR-3.2**: The system shall perform automated daily backups of all data.

**NFR-3.3**: The system shall recover from failures within 15 minutes.

### 6.4 Usability Requirements

**NFR-4.1**: The system shall be intuitive for users with basic computer literacy.

**NFR-4.2**: Help documentation shall be available in all supported languages.

**NFR-4.3**: The system shall provide clear error messages and guidance.

**NFR-4.4**: The interface shall be accessible to users with disabilities (WCAG 2.1 AA).

### 6.5 Scalability Requirements

**NFR-5.1**: The system architecture shall support horizontal scaling.

**NFR-5.2**: The database shall handle growth up to 100,000 complaints per year.

**NFR-5.3**: The system shall support addition of new user roles without major modifications.

---

## 7. Database Design

### 7.1 Entity Relationship Overview

The database design includes the following primary entities and their relationships:

#### 7.1.1 Core Tables

**Users Table**
- Stores user information for all system users
- Includes role-based permissions and authentication data
- Supports multilingual preferences

**Complaints Table**
- Central table for all complaint information
- Links to users, complaint types, and status logs
- Includes geolocation and media attachments

**Complaint Types Table**
- Configurable complaint categories
- Supports multilingual type descriptions
- Managed by administrators

**Status Logs Table**
- Audit trail for all complaint status changes
- Tracks user actions and timestamps
- Enables comprehensive reporting

**Zones and Sub-zones Tables**
- Geographic organization structure
- Supports hierarchical area management
- Links complaints to administrative boundaries

#### 7.1.2 Key Relationships

- **One-to-Many**: User to Complaints (one user can create multiple complaints)
- **Many-to-One**: Complaint to Complaint Type (multiple complaints can have the same type)
- **One-to-Many**: Complaint to Status Logs (one complaint has multiple status updates)
- **Many-to-One**: Complaint to Zone/Sub-zone (multiple complaints can be in the same area)

### 7.2 Data Integrity and Constraints

**Primary Keys**: All tables include auto-incrementing primary keys
**Foreign Keys**: Referential integrity maintained through foreign key constraints
**Indexes**: Strategic indexing on frequently queried columns
**Validation**: Database-level constraints for data validation

---

## 8. Appendices

### 8.1 Glossary

- **Complaint Lifecycle**: The complete process from complaint registration to closure
- **Geolocation**: GPS coordinates identifying the location of reported issues
- **Heatmap**: Visual representation of complaint density across geographic areas
- **OTP**: One-Time Password used for secure user verification
- **Role-based Access**: Security model where user permissions are based on assigned roles
- **Status Workflow**: Predefined sequence of complaint status changes

### 8.2 Assumptions and Dependencies

#### 8.2.1 Assumptions
- Users have access to internet connectivity
- Email addresses provided by users are valid and accessible
- Geographic coordinates can be obtained through browser geolocation or manual input
- Municipal staff are trained on system usage

#### 8.2.2 Dependencies
- PostgreSQL database server availability
- SMTP email service for notifications
- Web hosting infrastructure
- SSL certificate for secure communications

### 8.3 Future Enhancements

- **Mobile Application**: Native iOS and Android applications
- **SMS Notifications**: Text message alerts for status updates
- **Integration APIs**: Connection with existing municipal systems
- **Advanced Analytics**: Machine learning for predictive maintenance
- **Offline Capability**: Limited functionality without internet connectivity

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | November 2024 | Development Team | Initial SRS document |

---

*This document serves as the comprehensive specification for the CCMS Street Lighting Complaint Management System and should be reviewed and approved by all stakeholders before implementation begins.*