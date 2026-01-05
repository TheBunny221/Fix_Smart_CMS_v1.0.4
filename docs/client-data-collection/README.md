# Client Data Collection Template Guide

## Overview

This guide accompanies the `Client_Data_Collection_Template.xlsx` file, which is designed to collect the essential master data required to initialize the NLC-CMS Complaint Management System.

## Purpose

To ensure a smooth setup, we require accurate data regarding the administrative zones (Wards), complaint categories, and initial staff users. This data will be imported directly into the system database.

## Template Structure

The Excel file contains the following sheets:

1.  **Instructions**: General usage guidelines.
2.  **Global_Configuration**: System-wide settings.
3.  **Wards**: Administrative areas (Zones).
4.  **SubZones**: Smaller localities within Wards.
5.  **Complaint_Types**: Categories of issues with SLA definitions.
6.  **Staff_Users**: Accounts for Ward Officers, Administrators, and Maintenance Teams.

### Data Entry Format

Each sheet follows a standard structure:
-   **Row 1 (Header)**: The system field name. **Do not modify this.**
-   **Row 2 (Description)**: Explains the purpose of the field.
-   **Row 3 (Type/Required)**: Indicates data format (Text, Number, etc.) and if it is mandatory.
-   **Row 4 (Example)**: A sample value for reference.
-   **Row 5+ (Data)**: Enter your actual data starting from this row.

## Deployment & Relationships

### 1. Wards & SubZones
*   **Wards**: Must be unique. This is the top-level grouping.
*   **SubZones**: Every SubZone must belong to a Ward. The "Ward Name" column in the SubZones sheet must **exactly match** a Name provided in the Wards sheet.

### 2. Users & Roles
*   **Ward Officers**: Must be assigned to a specific Ward. Ensure the Ward Name matches the Wards sheet.
*   **Maintenance Teams**: Can be assigned to a Ward or generally available (if system allows, usually Ward-specific).
*   **Administrators**: Global access, no Ward assignment needed.

### 3. Complaint Types & SLAs
*   **Priority**: Must be one of: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
*   **SLA Hours**: The number of hours allowed for resolution before the complaint becomes Overdue.

## Important Notes

*   **Do not change the sheet names** as the import script relies on them.
*   **Do not reorder columns** if possible, though the system will match by header name.
*   **Unique Fields**: Ensure entries for Email (Users), Ward Name, and Complaint Type Name are unique to avoid import errors.

## Next Steps

Once completed, please return this Excel file to the technical team for validation and import.
