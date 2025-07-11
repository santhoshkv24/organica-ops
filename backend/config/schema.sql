CREATE TABLE `branches` (
  `branch_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` text,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','manager','team_lead','employee','customer_head','customer_employee') NOT NULL,
  `employee_id` int DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `employee_id` (`employee_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `fk_users_customer_employee` FOREIGN KEY (`customer_id`) REFERENCES `customer_employees` (`customer_employee_id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `customer_companies` (
  `customer_company_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `address` text,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `customer_details` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `customer_company_id` int DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `email` (`email`),
  KEY `customer_company_id` (`customer_company_id`),
  CONSTRAINT `customer_details_ibfk_1` FOREIGN KEY (`customer_company_id`) REFERENCES `customer_companies` (`customer_company_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `customer_employees` (
  `customer_employee_id` int NOT NULL AUTO_INCREMENT,
  `customer_company_id` int NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `is_head` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `customer_company_id` (`customer_company_id`),
  CONSTRAINT `customer_employees_ibfk_1` FOREIGN KEY (`customer_company_id`) REFERENCES `customer_companies` (`customer_company_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `customer_track_entries` (
  `customer_track_entry_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `assigned_to` int NOT NULL,
  `assigned_by` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `task_type` enum('Bug','Feature','Task','Documentation','Other') DEFAULT 'Task',
  `priority` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
  `status` enum('To Do','In Progress','Blocked','Done') DEFAULT 'To Do',
  `due_date` date DEFAULT NULL,
  `status_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_track_entry_id`),
  KEY `project_id` (`project_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `fk_customer_track_entries_assigned_by_user` (`assigned_by`),
  CONSTRAINT `customer_track_entries_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `customer_track_entries_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `customer_employees` (`customer_employee_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_customer_track_entries_assigned_by_user` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `customer_track_entry_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `customer_track_entry_id` int NOT NULL,
  `field_changed` varchar(50) NOT NULL,
  `old_value` text,
  `new_value` text,
  `changed_by` int NOT NULL,
  `is_customer` tinyint(1) DEFAULT '0',
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `customer_track_entry_id` (`customer_track_entry_id`),
  KEY `fk_customer_track_entry_history_changed_by_user` (`changed_by`),
  CONSTRAINT `customer_track_entry_history_ibfk_1` FOREIGN KEY (`customer_track_entry_id`) REFERENCES `customer_track_entries` (`customer_track_entry_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_customer_track_entry_history_changed_by_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `employees` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `team_id` int DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_picture` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`team_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `meeting_participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int DEFAULT NULL,
  `employee_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `meeting_participants_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`meeting_id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_participants_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `meetings` (
  `meeting_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `scheduled_by` int DEFAULT NULL,
  `team_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `location_or_link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`meeting_id`),
  KEY `scheduled_by` (`scheduled_by`),
  KEY `team_id` (`team_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `meetings_ibfk_1` FOREIGN KEY (`scheduled_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL,
  CONSTRAINT `meetings_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `projects` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `customer_company_id` int DEFAULT NULL,
  `project_manager_id` int NOT NULL,
  `description` text,
  `status` enum('planning','in_progress','on_hold','completed','cancelled') DEFAULT 'planning',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`project_id`),
  KEY `customer_company_id` (`customer_company_id`),
  KEY `project_manager_id` (`project_manager_id`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`customer_company_id`) REFERENCES `customer_companies` (`customer_company_id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`project_manager_id`) REFERENCES `employees` (`employee_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `project_team_members` (
  `project_team_member_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `employee_id` int DEFAULT NULL,
  `role` enum('team_member','team_lead','customer_head','customer_member') NOT NULL,
  `added_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `customer_employee_id` int DEFAULT NULL,
  PRIMARY KEY (`project_team_member_id`),
  UNIQUE KEY `unique_project_employee` (`project_id`,`employee_id`),
  KEY `added_by` (`added_by`),
  KEY `fk_ptm_employee` (`employee_id`),
  KEY `fk_ptm_customer_employee` (`customer_employee_id`),
  CONSTRAINT `fk_ptm_customer_employee` FOREIGN KEY (`customer_employee_id`) REFERENCES `customer_employees` (`customer_employee_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ptm_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `project_team_members_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `project_team_members_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `project_team_members_ibfk_3` FOREIGN KEY (`added_by`) REFERENCES `employees` (`employee_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `team_leads` (
  `team_lead_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int DEFAULT NULL,
  `team_id` int DEFAULT NULL,
  `assigned_by` int DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`team_lead_id`),
  KEY `employee_id` (`employee_id`),
  KEY `team_id` (`team_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `team_leads_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `team_leads_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`team_id`) ON DELETE CASCADE,
  CONSTRAINT `team_leads_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `teams` (
  `team_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`team_id`),
  KEY `teams_ibfk_2` (`branch_id`),
  CONSTRAINT `teams_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `track_entries` (
  `track_entry_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `assigned_to` int NOT NULL,
  `assigned_by` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `task_type` enum('Bug','Feature','Task','Documentation','Other') DEFAULT 'Task',
  `priority` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
  `status` enum('To Do','In Progress','Blocked','Done') DEFAULT 'To Do',
  `due_date` date DEFAULT NULL,
  `hours_spent` decimal(5,2) DEFAULT '0.00',
  `hours_worked` decimal(5,2) DEFAULT '0.00',
  `status_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`track_entry_id`),
  KEY `project_id` (`project_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `fk_track_entries_assigned_by_user` (`assigned_by`),
  CONSTRAINT `fk_track_entries_assigned_by_user` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `track_entries_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `track_entries_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `track_entry_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `track_entry_id` int NOT NULL,
  `field_changed` varchar(50) NOT NULL,
  `old_value` text,
  `new_value` text,
  `changed_by` int NOT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `track_entry_id` (`track_entry_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `track_entry_history_ibfk_1` FOREIGN KEY (`track_entry_id`) REFERENCES `track_entries` (`track_entry_id`) ON DELETE CASCADE,
  CONSTRAINT `track_entry_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `employees` (`employee_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `patch_movement_requests` (
  `patch_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `patch_name` varchar(255) NOT NULL,
  `patch_description` text NOT NULL,
  `patch_type` enum('Hotfix','Security Update','Feature Patch','Bug Fix','Emergency','Maintenance') NOT NULL,
  `severity` enum('Low','Medium','High','Critical') NOT NULL,
  `environment_affected` enum('Dev','QA','UAT','Production','All') NOT NULL,
  `estimated_deployment_time` int NOT NULL COMMENT 'Estimated time in minutes',
  `scheduled_deployment_time` datetime DEFAULT NULL,
  `attached_document` varchar(500) DEFAULT NULL COMMENT 'File path or document reference',
  `requested_by` int NOT NULL,
  `status` enum('Pending','Approved','Rejected','On Hold','Deployed','Cancelled') DEFAULT 'Pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `team_lead_id` int NOT NULL,
  PRIMARY KEY (`patch_id`),
  KEY `project_id` (`project_id`),
  KEY `requested_by` (`requested_by`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_status` (`status`),
  KEY `idx_patch_type` (`patch_type`),
  KEY `idx_severity` (`severity`),
  KEY `fk_patch_movement_requests_team_lead` (`team_lead_id`),
  CONSTRAINT `fk_patch_movement_requests_team_lead` FOREIGN KEY (`team_lead_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_patch_requests_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_patch_requests_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_patch_requests_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `inventory_loans` (
  `loan_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `requested_by_user_id` int NOT NULL,
  `responsible_team_id` int NOT NULL,
  `purpose` text,
  `status` enum('Pending Approval','Approved','Rejected','Issued','Partially Returned','Returned','Cancelled') DEFAULT 'Pending Approval',
  `approved_by_user_id` int DEFAULT NULL,
  `issued_by_user_id` int DEFAULT NULL,
  `request_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approval_date` timestamp NULL DEFAULT NULL,
  `issued_date` timestamp NULL DEFAULT NULL,
  `expected_return_date` date NOT NULL,
  `actual_return_date` timestamp NULL DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`loan_id`),
  KEY `project_id` (`project_id`),
  KEY `requested_by_user_id` (`requested_by_user_id`),
  KEY `responsible_team_id` (`responsible_team_id`),
  KEY `approved_by_user_id` (`approved_by_user_id`),
  KEY `issued_by_user_id` (`issued_by_user_id`),
  CONSTRAINT `fk_inventory_loans_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  CONSTRAINT `fk_inventory_loans_requested_by` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_inventory_loans_responsible_team` FOREIGN KEY (`responsible_team_id`) REFERENCES `teams` (`team_id`),
  CONSTRAINT `fk_inventory_loans_approved_by` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_inventory_loans_issued_by` FOREIGN KEY (`issued_by_user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `inventory_loan_items` (
  `loan_item_id` int NOT NULL AUTO_INCREMENT,
  `loan_id` int NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity_requested` int NOT NULL,
  `quantity_issued` int DEFAULT '0',
  `quantity_returned` int DEFAULT '0',
  PRIMARY KEY (`loan_item_id`),
  KEY `loan_id` (`loan_id`),
  CONSTRAINT `fk_inventory_loan_items_loan` FOREIGN KEY (`loan_id`) REFERENCES `inventory_loans` (`loan_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;