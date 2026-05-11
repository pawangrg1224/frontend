# Requirements Document

## Introduction

This feature improves the department navigation experience in the user dashboard by keeping the sidebar visible when viewing department details. Currently, clicking on a department from the sidebar navigates to a standalone page that loses the sidebar context. The new implementation will display department-specific doctors in the main content area while maintaining the sidebar layout.

## Glossary

- **User_Dashboard**: The authenticated user's dashboard interface located at `/dashboard/user`
- **Sidebar**: The left navigation panel containing menu items and department dropdown
- **Department_Dropdown**: The expandable "Departments" menu item in the sidebar that displays a list of departments
- **Department**: A medical service category (e.g., Cardiology, Neurology) with associated doctors
- **Doctor_List**: The collection of doctors assigned to a specific department
- **Main_Content_Area**: The primary display region to the right of the sidebar where page content is rendered
- **SidebarLayout**: The React component that provides the sidebar and main content layout structure
- **Department_Page**: The standalone page at `/dashboard/services/[id]/page.tsx` that currently displays department details

## Requirements

### Requirement 1: Maintain Sidebar Visibility

**User Story:** As a user, I want the sidebar to remain visible when viewing department details, so that I can easily navigate to other departments or menu items without losing context.

#### Acceptance Criteria

1. WHEN a user clicks on a department from the Department_Dropdown, THE Main_Content_Area SHALL display the Doctor_List for that department
2. WHILE viewing department details, THE Sidebar SHALL remain visible and functional
3. THE User_Dashboard SHALL NOT navigate to a separate route when a department is selected
4. THE SidebarLayout component SHALL remain mounted throughout department navigation

### Requirement 2: Display Department Doctors

**User Story:** As a user, I want to see the list of doctors assigned to a department when I select it, so that I can view available medical professionals in that specialty.

#### Acceptance Criteria

1. WHEN a department is selected from the Department_Dropdown, THE Main_Content_Area SHALL fetch doctors from `/api/services/${id}/doctors`
2. THE Doctor_List SHALL display each doctor's name, specialization, availability status, and profile information
3. IF the API request fails, THEN THE Main_Content_Area SHALL display an error message
4. WHEN no doctors are assigned to a department, THE Main_Content_Area SHALL display a message indicating no doctors are available
5. THE Doctor_List SHALL include both real doctors from the API and mock doctors for demonstration purposes

### Requirement 3: Remove Standalone Department Page

**User Story:** As a developer, I want to remove the standalone department page route, so that the application maintains a consistent layout structure.

#### Acceptance Criteria

1. THE Department_Page at `/dashboard/services/[id]/page.tsx` SHALL be removed from the codebase
2. THE User_Dashboard allowlist SHALL continue to include `/dashboard/services` for department access
3. WHEN a user attempts to directly access `/dashboard/services/[id]`, THE application SHALL redirect to the User_Dashboard home page
4. THE removal SHALL NOT break existing department navigation functionality in the Sidebar

### Requirement 4: Preserve Department Selection State

**User Story:** As a user, I want the selected department to be visually highlighted in the sidebar, so that I know which department I am currently viewing.

#### Acceptance Criteria

1. WHEN a department is selected, THE Department_Dropdown SHALL highlight the selected department with active styling
2. THE Department_Dropdown SHALL remain expanded while viewing a department's Doctor_List
3. WHEN navigating to a different menu item, THE department selection SHALL be cleared
4. THE active department styling SHALL use the same visual treatment as other active navigation items

### Requirement 5: Maintain Doctor Interaction Features

**User Story:** As a user, I want to interact with doctor profiles and book appointments, so that I can schedule medical consultations.

#### Acceptance Criteria

1. WHEN a user clicks on a doctor from the Doctor_List, THE application SHALL open a drawer displaying detailed doctor information
2. THE doctor detail drawer SHALL display education, experience, rating, and available time slots
3. WHEN a user selects a time slot, THE application SHALL allow booking an appointment
4. THE booking functionality SHALL support both self-booking (for regular users) and patient selection (for admin/doctor users)
5. THE drawer SHALL close when the user clicks outside or presses the close button

### Requirement 6: Handle Department Data Loading

**User Story:** As a user, I want to see loading indicators when department data is being fetched, so that I understand the application is processing my request.

#### Acceptance Criteria

1. WHEN a department is selected, THE Main_Content_Area SHALL display a loading indicator while fetching the Doctor_List
2. THE loading indicator SHALL be visually consistent with other loading states in the application
3. WHEN the Doctor_List loads successfully, THE loading indicator SHALL be replaced with the doctor cards
4. THE Department_Dropdown SHALL fetch departments from `/api/services?limit=100` on component mount
5. IF the department list fetch fails, THEN THE Department_Dropdown SHALL display "No departments yet"

### Requirement 7: Preserve URL State for Department Selection

**User Story:** As a user, I want the URL to reflect the selected department, so that I can bookmark or share specific department views.

#### Acceptance Criteria

1. WHEN a department is selected, THE browser URL SHALL update to include the department identifier
2. WHEN a user navigates directly to a department URL, THE Main_Content_Area SHALL display the corresponding Doctor_List
3. THE URL format SHALL use query parameters or hash fragments to avoid route conflicts
4. WHEN the URL contains a department identifier, THE Department_Dropdown SHALL auto-expand and highlight the selected department
5. THE browser back/forward buttons SHALL correctly navigate between department selections

### Requirement 8: Responsive Department Icon Display

**User Story:** As a user, I want to see relevant icons for each department, so that I can quickly identify medical specialties visually.

#### Acceptance Criteria

1. THE Department_Dropdown SHALL display an icon next to each department name
2. THE icon SHALL be selected based on keyword matching from the department name
3. WHEN no keyword match is found, THE Department_Dropdown SHALL display a default Stethoscope icon
4. THE icon colors SHALL be consistent with the existing DEPT_ICONS mapping in SidebarLayout
5. THE icons SHALL scale appropriately on hover for visual feedback
