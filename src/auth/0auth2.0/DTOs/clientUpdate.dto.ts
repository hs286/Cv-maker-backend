import { UpdateWorkHistoryDto } from "../../../profile/DTOs/updateWorkHistory.dto";
import { UpdateEducationHistoryDto } from "../../../profile/DTOs/updateEducationHistory.dto";
import { UpdateTrainingsDto } from "../../../profile/DTOs/updateTrainings.dto";
import { UpdateVolunteeringDto } from "../../../profile/DTOs/updateVolunteering.dto";
import { UpdateCertificatesDto } from "../../../profile/DTOs/updateCertificates.dto";

export class WorkHistory {
  jobTitle: string;
  companyName: string;
  city: string;
  startDate: string;
  endDate: string;
  role: string;
  responsibilities?: string[]; // Array of responsibilities (optional)
  achievements?: string[]; // Array of achievements (optional)
  projects: Project[];
}

export class Education {
  educationLevel: string;
  fieldOfStudy: string;
  institutionName: string;
  startDate: string;
  endDate: string;
}

export class Training {
  title: string;
  institutionName: string;
  startDate: string;
  endDate: string;
}

export class Project {
  name: string;
  scope: string;
  budget?: number; // Optional
  teamSize?: number; // Optional
  result: string;
}

export class Certificate {
  name: string;
  issuer: string;
  year: string;
}

export class Volunteering {
  title: string; // Typo in field name corrected
  organizationName: string;
  city: string;
  startDate: string;
  endDate: string;
  description?: string; // Optional
}

export class Publication {
  title: string;
  publisher: string;
  url?: string; // Optional
  startDate: string;
  endDate: string;
  description?: string; // Optional
}


export class Membership {
  name: string;
  issuer: string;
  startDate: string;
  endDate: string;
}

export class Patent {
  name: string;
  number: string;
  url?: string; // Optional
  date: Date;
  description?: string; // Optional
}

export class ClientUpdateDto {
  id?: number;
  userId: string;
  // Personal Information
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  location?: string;
  postCode?: string;
  portfolio?: string;
  profileLink?: string;
  profileSummary?: string;

  // Work History as an array of WorkHistory objects
  workHistory?: UpdateWorkHistoryDto[]; // Define a dedicated interface for WorkHistory

  // Educations as an array of Education objects
  educations?: UpdateEducationHistoryDto[]; // Define a dedicated interface for Education

  // Other fields as arrays of objects
  trainings?: UpdateTrainingsDto[]; // Define a dedicated interface for Training
  certificates?: UpdateCertificatesDto[]; // Define a dedicated interface for Certificate
  volunteerings?: UpdateVolunteeringDto[]; // Define a dedicated interface for Volunteering
  publications?: Publication[]; // Define a dedicated interface for Publication
  projects?: Project[]; // Consider renaming to avoid conflict with top-level "projects"
  memberships?: Membership[]; // Define a dedicated interface for Membership
  patents?: Patent[]; // Define a dedicated interface for Patent

  // Skills as a list of strings
  skills?: string[];
}