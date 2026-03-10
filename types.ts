
export enum SpeechTone {
  AUFGELOCKERT = 'Aufgelockert & Feiernd (Lebensbejahend)',
  TRAURIG = 'Traurig & Mitfühlend',
  FORMAL = 'Formal & Würdevoll',
  POETISCH = 'Poetisch & Philosophisch',
  RELIGIOES = 'Kirchlich/Religiös geprägt',
  SAE_KULAR = 'Nicht-kirchlich/Weltlich'
}

export interface InterviewData {
  // A) Organisatorisches
  ceremonyDate: string;
  ceremonyTime: string;
  cemeteryAddress: string;
  meetingPoint: string;
  burialType: string;
  visitorCount: string;
  speechLocation: string;
  graveEscort: string;
  funeralCardPhotos: string;
  musicAccompaniment: string;
  otherOrganisational: string;

  // B) Grunddaten
  deceasedName: string;
  birthDate: string;
  birthPlace: string;
  deathDate: string;
  deathPlace: string;
  lastResidence: string;
  maritalStatus: string;
  partnerName: string;
  marriageDetails: string;
  partnerMeeting: string;
  childrenNames: string;
  grandchildrenNames: string;
  parentsNames: string;
  siblingsDetails: string;
  birthOrder: string;
  medicalSupporters: string;
  religion: string;
  clubMemberships: string;
  otherGrunddaten: string;

  // C) Lebensgeschichte
  bio_youth_details: string;
  bio_original_profession: string;
  bio_qualifications: string;
  bio_last_profession: string;
  bio_hobbies_list: string;
  bio_shared_hobbies: string;
  bio_other: string;

  // D) Charakter
  personality_3words: string;
  personality_typical: string;
  personality_traits: string;
  personality_happy: string;
  personality_wellbeing_places: string;

  // E) Werte & Abschluss
  values_milestones: string;
  friends_contacts: string;
  crises_handling: string;
  illness_death: string;
  speech_must_haves: string;
  speech_taboos: string;
  thanks_names: string;
  additional_notes: string;
}

export interface SpeechSection {
  id: string;
  title: string;
  content: string;
}

export interface AppState {
  step: 'login' | 'menu' | 'interview' | 'style' | 'generation';
  version: 'demo' | 'full' | null;
  interview: InterviewData;
  religiousContext: 'kirchlich' | 'nicht-kirchlich';
  tones: SpeechTone[];
  outlines: { tone: SpeechTone; sections: SpeechSection[] }[];
  isGenerating: boolean;
  generationProgress: number;
}

export const INITIAL_INTERVIEW: InterviewData = {
  ceremonyDate: '',
  ceremonyTime: '',
  cemeteryAddress: '',
  meetingPoint: '',
  burialType: '',
  visitorCount: '',
  speechLocation: '',
  graveEscort: '',
  funeralCardPhotos: '',
  musicAccompaniment: '',
  otherOrganisational: '',
  deceasedName: '',
  birthDate: '',
  birthPlace: '',
  deathDate: '',
  deathPlace: '',
  lastResidence: '',
  maritalStatus: '',
  partnerName: '',
  marriageDetails: '',
  partnerMeeting: '',
  childrenNames: '',
  grandchildrenNames: '',
  parentsNames: '',
  siblingsDetails: '',
  birthOrder: '',
  medicalSupporters: '',
  religion: '',
  clubMemberships: '',
  otherGrunddaten: '',
  bio_youth_details: '',
  bio_original_profession: '',
  bio_qualifications: '',
  bio_last_profession: '',
  bio_hobbies_list: '',
  bio_shared_hobbies: '',
  bio_other: '',
  personality_3words: '',
  personality_typical: '',
  personality_traits: '',
  personality_happy: '',
  personality_wellbeing_places: '',
  values_milestones: '',
  friends_contacts: '',
  crises_handling: '',
  illness_death: '',
  speech_must_haves: '',
  speech_taboos: '',
  thanks_names: '',
  additional_notes: '',
};
