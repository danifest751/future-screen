-- Backfill English content for core public/admin entities.
-- Goal: EN locale must not show RU text via fallback.

-- privacy policy
UPDATE public.site_content
SET
  title_en = 'Privacy Policy',
  content_en = E'# Website Privacy Policy (Future Screen)\n\n**Effective date:** April 1, 2026\n**Version:** 1.0\n\n## 1. General Provisions\n\nThis Privacy Policy explains how personal data is processed and protected when using **https://future-screen.vercel.app/** (the "Website").\n\nBy using the Website and submitting any request form, the user confirms that they have read and accepted this Policy.\n\n## 2. Data Controller\n\n**Controller:** Pataraia Grigoriy Tamazievich  \n**Location:** Yekaterinburg, Alpinstov Street 59  \n**Email for privacy requests:** femida4me@gmail.com  \n**Phone:** +7 912 246-65-66\n\n## 3. Personal Data We Process\n\nWe may process:\n- full name;\n- phone number;\n- email address;\n- company name;\n- details included in user messages and service requests;\n- technical data collected automatically (IP address, browser and device details, cookies, requested URLs, access date and time).\n\nWe do not intentionally process special categories of personal data or biometric data.\n\n## 4. Processing Purposes\n\nPersonal data is processed to:\n1. handle incoming requests and feedback;\n2. provide consultations about event equipment rental services;\n3. communicate with users via phone, email, and messengers;\n4. prepare commercial offers and service proposals;\n5. conclude and perform contracts;\n6. maintain internal service records;\n7. ensure Website performance and security;\n8. analyze traffic and improve Website quality;\n9. comply with legal obligations.\n\n## 5. Legal Grounds\n\nWe process personal data based on:\n- user consent;\n- necessity to conclude or perform a contract;\n- legal obligations under applicable law.\n\n## 6. Processing Methods\n\nProcessing may be automated and non-automated and can include collection, recording, systematization, storage, updating, extraction, use, transfer, anonymization, blocking, deletion, and destruction.\n\n## 7. Sharing with Third Parties\n\nData may be shared with service providers only when necessary to:\n- process user requests;\n- perform contractual obligations;\n- operate hosting, communication, analytics, CRM, and mailing systems;\n- comply with legal requirements.\n\n## 8. Cross-Border Transfers\n\nCross-border transfer is performed only when legally justified and compliant with applicable personal data law.\n\n## 9. Retention Period\n\nData is retained only as long as needed for processing purposes, unless a longer period is required by law or contract.\n\n## 10. Cookies and Analytics\n\nThe Website uses cookies for:\n- correct technical operation;\n- storing user preferences;\n- traffic analytics and service improvements.\n\n## 11. User Rights\n\nUsers may:\n- request information about data processing;\n- request correction, blocking, or deletion of personal data;\n- withdraw consent;\n- file a complaint with a competent authority or court.\n\nPrivacy requests: femida4me@gmail.com\n\n## 12. Data Protection Measures\n\nWe use organizational and technical safeguards, including access restriction and security controls, to protect personal data.\n\n## 13. Minors\n\nThe Website is not intended for the purposeful collection of data from minors.\n\n## 14. Policy Updates\n\nThe Controller may update this Policy. The latest version is always published on the Website.\n\n## 15. Contacts\n\n**Controller:** Pataraia Grigoriy Tamazievich  \n**Email:** femida4me@gmail.com  \n**Phone:** +7 912 246-65-66  \n**Address:** Yekaterinburg, Alpinstov Street 59',
  meta_title_en = 'Privacy Policy - Future Screen',
  meta_description_en = 'Privacy Policy of Future Screen for event equipment rental services.',
  updated_at = now()
WHERE key = 'privacy_policy';

-- contacts
UPDATE public.contacts
SET
  address_en = '5A Bolshoy Konny Peninsula, Yekaterinburg',
  working_hours_en = 'Daily 10:00-20:00'
WHERE id IS NOT NULL;

-- packages
UPDATE public.packages
SET
  name_en = 'Lite',
  for_formats_en = ARRAY['Press approach', 'Presentation', 'Small conference'],
  includes_en = ARRAY[
    'LED screen / projector up to 20 m2 or TV',
    'Basic sound and 1-2 microphones',
    'Stage and speaker lighting',
    'On-site engineer'
  ],
  options_en = ARRAY['Delivery / setup', 'Online streaming', 'Session recording'],
  price_hint_en = 'Fast launch and compact setup'
WHERE id = 1;

UPDATE public.packages
SET
  name_en = 'Medium',
  for_formats_en = ARRAY['Forum / conference', 'Mid-size concert', 'Exhibition booth'],
  includes_en = ARRAY[
    'LED 20-50 m2 with stage portal or multiple screens',
    'Sound system for the venue, wireless systems',
    'Stage / architectural lighting with console',
    'Processing, switching, and engineering shift'
  ],
  options_en = ARRAY[
    'Power and equipment redundancy',
    'Backline',
    'Media server and playout'
  ],
  price_hint_en = 'Balanced cost, coverage, and risk level'
WHERE id = 2;

UPDATE public.packages
SET
  name_en = 'Big',
  for_formats_en = ARRAY['City event', 'Large concert', 'Federal forum'],
  includes_en = ARRAY[
    'LED over 50 m2, curved and suspended structures',
    'Line arrays, monitors, and backup channels',
    'Full lighting setup and managed stage',
    'Redundant processing and backup engineering crew'
  ],
  options_en = ARRAY[
    'Broadcast / multi-camera production',
    'Call tracking and analytics',
    'Additional portals and totems'
  ],
  price_hint_en = 'Maximum coverage and fault tolerance'
WHERE id = 3;

-- categories
UPDATE public.categories
SET
  title_en = 'Lighting Equipment',
  short_description_en = 'Stage, expo, or banquet with a tailored lighting design.',
  bullets_en = ARRAY[
    'Selection based on venue format and event scenario',
    'Stage and architectural lighting, consoles, and stands',
    'Engineer and setup included when required'
  ]
WHERE id = 1;

UPDATE public.categories
SET
  title_en = 'Video Equipment',
  short_description_en = 'Screens, projectors, cameras, and switching for live events and broadcast.',
  bullets_en = ARRAY[
    'LED and projection solutions tuned for venue and ambient light',
    'Playout, processing, switching, and media servers',
    'Operator and technical support on site'
  ]
WHERE id = 2;

UPDATE public.categories
SET
  title_en = 'Sound Equipment',
  short_description_en = 'Line arrays, monitors, mixers, and wireless systems.',
  bullets_en = ARRAY[
    'Power and coverage planning for the specific venue and format',
    'Mixer selection by input count and event tasks',
    'Setup and tuning by specialists'
  ]
WHERE id = 3;

UPDATE public.categories
SET
  title_en = 'Stages and Podiums',
  short_description_en = 'Stages, portals, podiums, FOH towers, and barriers.',
  bullets_en = ARRAY[
    'Typical configurations for concerts, expos, and city events',
    'Winches, stairs, railings, barriers, and stage structures',
    'Installation and logistics included when required'
  ]
WHERE id = 4;

UPDATE public.categories
SET
  title_en = 'Musical Instruments',
  short_description_en = 'Drums, keys, guitars, and backline for live performances.',
  bullets_en = ARRAY[
    'Set tailored to genre and setlist',
    'Servicing and tuning before showtime',
    'Delivery and return with safe handling'
  ]
WHERE id = 5;

-- cases
UPDATE public.cases
SET
  title_en = 'Forum in Yekaterinburg',
  city_en = 'Yekaterinburg',
  date_en = '2024',
  format_en = 'Forum',
  summary_en = 'LED portals and stage backdrop, sound system for 800 guests, and lighting for speakers and broadcast.',
  metrics_en = '800 guests, 2 days, processing redundancy'
WHERE slug = 'forum-ekb-2024';

UPDATE public.cases
SET
  title_en = 'City Concert',
  city_en = 'Tyumen',
  date_en = '2023',
  format_en = 'Concert',
  summary_en = 'Large stage with portals, line arrays, curved LED backdrop, and show lighting.',
  metrics_en = '5,000 spectators, 80x60 m coverage'
WHERE slug = 'city-concert';

UPDATE public.cases
SET
  title_en = 'Expo Booth',
  city_en = 'Moscow',
  date_en = '2024',
  format_en = 'Exhibition',
  summary_en = 'LED totems and central screen, content playout, and overnight rapid assembly.',
  metrics_en = '6-hour installation, 3-day operation'
WHERE slug = 'expo-stand';

-- rental categories names (core EN visibility in lists/dropdowns)
UPDATE public.rental_categories SET name_en = 'Video Equipment', short_name_en = 'Video' WHERE slug = 'video';
UPDATE public.rental_categories SET name_en = 'Sound Equipment', short_name_en = 'Sound' WHERE slug = 'sound';
UPDATE public.rental_categories SET name_en = 'Lighting Equipment', short_name_en = 'Lighting' WHERE slug = 'light';
UPDATE public.rental_categories SET name_en = 'Stages and Podiums', short_name_en = 'Stages' WHERE slug = 'stage';
UPDATE public.rental_categories SET name_en = 'Musical Instruments', short_name_en = 'Instruments' WHERE slug = 'instruments';
UPDATE public.rental_categories SET name_en = 'Computers and Laptops', short_name_en = 'Computers' WHERE slug = 'computers';
UPDATE public.rental_categories SET name_en = 'Touchscreens and Displays', short_name_en = 'Touchscreens' WHERE slug = 'touchscreens';
UPDATE public.rental_categories SET name_en = 'Event Staff', short_name_en = 'Staff' WHERE slug = 'staff';
