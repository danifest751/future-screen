import { contactsContent } from '../content/data/contacts';

export const contacts: {
  phones: string[];
  emails: string[];
  address: string;
  workingHours: string;
} = {
  phones: [...contactsContent.phones],
  emails: [...contactsContent.emails],
  address: contactsContent.address,
  workingHours: contactsContent.workingHours,
};
