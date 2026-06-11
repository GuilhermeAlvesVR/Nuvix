type InitialProfessionalProfileInput = {
  alsoProfessional: boolean;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerUserId?: string | null;
  workspaceId: string;
};

export function buildInitialProfessionalProfile(input: InitialProfessionalProfileInput) {
  if (!input.alsoProfessional || !input.ownerUserId) {
    return null;
  }

  return {
    workspaceId: input.workspaceId,
    userId: input.ownerUserId,
    name: input.ownerName,
    email: input.ownerEmail,
    phone: input.ownerPhone,
    active: true,
  };
}
