export const TERMS_AUDIENCES = {
  PRIVATE_DRIVER: 'private_driver',
  COMPANY_DRIVER: 'company_driver',
  PRIVATE_PA: 'private_pa',
  COMPANY_PA: 'company_pa',
}

export const TERMS_AUDIENCE_LIST = [
  TERMS_AUDIENCES.PRIVATE_DRIVER,
  TERMS_AUDIENCES.COMPANY_DRIVER,
  TERMS_AUDIENCES.PRIVATE_PA,
  TERMS_AUDIENCES.COMPANY_PA,
]

export function formatTermsAudienceLabel(audience) {
  switch (audience) {
    case TERMS_AUDIENCES.PRIVATE_DRIVER:
      return 'Private Driver'
    case TERMS_AUDIENCES.COMPANY_DRIVER:
      return 'Company / Fleet Driver'
    case TERMS_AUDIENCES.PRIVATE_PA:
      return 'Private PA'
    case TERMS_AUDIENCES.COMPANY_PA:
      return 'Company / Fleet PA'
    default:
      return String(audience || '')
  }
}
