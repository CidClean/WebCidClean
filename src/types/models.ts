import type { Database } from './database'

type Tables = Database['public']['Tables']

export type Client = Tables['clients']['Row']
export type ClientInsert = Tables['clients']['Insert']
export type ClientBillingInfo = Tables['client_billing_info']['Row']
export type ClientDocument = Tables['client_documents']['Row']
export type JobSite = Tables['job_sites']['Row']
export type JobSiteInsert = Tables['job_sites']['Insert']
export type JobSiteArea = Tables['job_site_areas']['Row']
export type AreaPicture = Tables['area_pictures']['Row']
export type Quote = Tables['quotes']['Row']
export type QuoteLineItem = Tables['quote_line_items']['Row']
export type QuoteResponse = Tables['quote_responses']['Row']
export type Staff = Tables['staff']['Row']
export type JobStaffAssignment = Tables['job_staff_assignments']['Row']
export type CatalogItem = Tables['catalog_items']['Row']
export type Discount = Tables['discounts']['Row']
export type AppSettings = Tables['app_settings']['Row']
export type WorkLog = Tables['work_logs']['Row']

export type ClientStatus = Client['status']
export type JobSiteStatus = JobSite['status']
export type FrequencyType = JobSite['frequency']
export type Weekday = NonNullable<JobSite['frequency_days']>[number]
export type AreaSize = JobSiteArea['size']
export type AreaCondition = JobSiteArea['condition']
export type QuoteStatusValue = Quote['status']
export type QuoteResponseAction = QuoteResponse['action']
export type StaffType = Staff['type']
export type CatalogItemKind = CatalogItem['kind']
export type DiscountType = Discount['type']

export const FACILITY_TYPES = [
  'Office',
  'Medical Center',
  'Retail Store',
  'Restaurant',
  'Warehouse / Industrial',
  'Gym / Fitness Center',
  'School / Daycare',
  'Religious Facility',
  'Residential / Apartment Complex',
  'Other',
] as const
export type FacilityType = (typeof FACILITY_TYPES)[number]

export const AREA_TYPES = [
  'Bathroom',
  'Lobby',
  'Office',
  'Kitchen / Break Room',
  'Conference Room',
  'Hallway',
  'Reception',
  'Warehouse',
  'Retail Floor',
  'Exam Room',
  'Classroom',
  'Other',
] as const
export type AreaType = (typeof AREA_TYPES)[number]

export const CLIENT_STATUSES: ClientStatus[] = [
  'prospect',
  'contacted',
  'in_process',
  'quoted',
  'pending',
  'active',
  'archived',
]

export const JOB_SITE_STATUSES: JobSiteStatus[] = ['new', 'pending', 'approved', 'active', 'archived']

export const FREQUENCY_TYPES: FrequencyType[] = ['one_time', 'daily', 'weekly', 'biweekly', 'monthly', 'custom']

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

export const AREA_SIZES: AreaSize[] = ['small', 'normal', 'big']
export const AREA_CONDITIONS: AreaCondition[] = ['good', 'normal', 'bad']
export const STAFF_TYPES: StaffType[] = ['employee', 'contractor']
export const CATALOG_ITEM_KINDS: CatalogItemKind[] = ['service', 'addon']
export const DISCOUNT_TYPES: DiscountType[] = ['percentage', 'fixed']
