-- Backfill full EN content for rental_categories localized JSON blocks.
-- This migration ensures admin/public EN locale does not fall back to RU content.

UPDATE public.rental_categories
SET
  name_en = 'Lighting Equipment',
  short_name_en = 'Lighting',
  seo_en = jsonb_build_object(
    'title', 'Lighting Equipment Rental - Future Screen',
    'description', 'Professional lighting rental for events, concerts, conferences, and exhibitions.'
  ),
  hero_en = jsonb_build_object(
    'title', 'Lighting Equipment Rental',
    'subtitle', 'Flexible lighting setups for stage, expo, corporate, and city events.',
    'ctaPrimary', 'Request quote',
    'ctaSecondary', 'Learn more',
    'highlights', jsonb_build_array(
      jsonb_build_object('text', 'Fast delivery and setup'),
      jsonb_build_object('text', 'On-site technical support'),
      jsonb_build_object('text', 'Scalable from compact to large formats')
    ),
    'showBlurTitle', coalesce((hero ->> 'showBlurTitle')::boolean, true)
  ),
  about_en = jsonb_build_object(
    'title', 'About this category',
    'text', 'Lighting defines the atmosphere, directs attention, and improves visual quality for guests and speakers. We provide lighting packages from basic conference kits to full-scale show systems.',
    'items', jsonb_build_array(
      'PAR and profile fixtures',
      'Moving heads and LED bars',
      'DMX control and programming',
      'Rigging and support structures'
    )
  ),
  use_cases_en = jsonb_build_array(
    jsonb_build_object('title', 'Corporate events', 'description', 'Stage and hall lighting for business programs'),
    jsonb_build_object('title', 'Concerts and festivals', 'description', 'Dynamic show lighting synchronized with content'),
    jsonb_build_object('title', 'Exhibitions', 'description', 'Accent lighting for stands and product zones')
  ),
  service_includes_en = jsonb_build_object(
    'title', 'What is included',
    'items', jsonb_build_array(
      'Configuration planning for venue and format',
      'Delivery, setup, and alignment',
      'On-site technical operation',
      'Dismantling after the event'
    )
  ),
  benefits_en = jsonb_build_object(
    'title', 'Benefits',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Flexible configuration', 'description', 'Equipment set is adjusted to scope and budget'),
      jsonb_build_object('title', 'Reliable execution', 'description', 'Redundancy options for key nodes are available'),
      jsonb_build_object('title', 'Integrated workflow', 'description', 'Works seamlessly with video, sound, and stage areas')
    )
  ),
  gallery_en = coalesce(gallery_en, '[]'::jsonb),
  faq_en = jsonb_build_object(
    'title', 'Frequently asked questions',
    'items', jsonb_build_array(
      jsonb_build_object('question', 'How do I choose the setup?', 'answer', 'Share venue and event details, and we prepare a suitable specification.'),
      jsonb_build_object('question', 'Is installation included?', 'answer', 'Yes, installation and dismantling are included in the service flow.'),
      jsonb_build_object('question', 'Do you work outside the city?', 'answer', 'Yes, we support regional projects with agreed logistics.')
    )
  ),
  bottom_cta_en = jsonb_build_object(
    'title', 'Need help with lighting setup?',
    'text', 'Tell us about your event and venue. We will prepare a practical configuration and budget estimate.',
    'primaryCta', 'Request quote',
    'secondaryCta', 'Contact engineer'
  )
WHERE slug = 'light';

UPDATE public.rental_categories
SET
  name_en = 'Video Equipment',
  short_name_en = 'Video',
  seo_en = jsonb_build_object(
    'title', 'Video Equipment Rental - Future Screen',
    'description', 'LED screens, projectors, switching, and playback solutions for live events.'
  ),
  hero_en = jsonb_build_object(
    'title', 'Video Equipment Rental',
    'subtitle', 'Screens, projection, and video control for clear and stable event visuals.',
    'ctaPrimary', 'Request quote',
    'ctaSecondary', 'Get consultation',
    'highlights', jsonb_build_array(
      jsonb_build_object('text', 'LED and projection setups'),
      jsonb_build_object('text', 'Switching and media playback'),
      jsonb_build_object('text', 'Operator support on site')
    ),
    'showBlurTitle', coalesce((hero ->> 'showBlurTitle')::boolean, true)
  ),
  about_en = jsonb_build_object(
    'title', 'About this category',
    'text', 'Video systems are the core of audience communication at modern events. We design solutions for visibility, reliability, and smooth operation.',
    'items', jsonb_build_array(
      'LED walls and side screens',
      'Projectors and lenses',
      'Video switchers and processors',
      'Playback and signal routing'
    )
  ),
  use_cases_en = jsonb_build_array(
    jsonb_build_object('title', 'Forums and conferences', 'description', 'Presentation support for speakers and delegates'),
    jsonb_build_object('title', 'Concert production', 'description', 'Backdrop and side screen content display'),
    jsonb_build_object('title', 'Exhibitions', 'description', 'Digital signage and interactive visual zones')
  ),
  service_includes_en = jsonb_build_object(
    'title', 'What is included',
    'items', jsonb_build_array(
      'System design for venue conditions',
      'Delivery and setup',
      'Video routing and playback setup',
      'Technical operation during event'
    )
  ),
  benefits_en = jsonb_build_object(
    'title', 'Benefits',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Clear picture', 'description', 'Solutions are selected for distance and lighting conditions'),
      jsonb_build_object('title', 'Operational stability', 'description', 'Signal paths and key nodes are validated before showtime'),
      jsonb_build_object('title', 'Scalable architecture', 'description', 'System grows from compact format to multi-screen layouts')
    )
  ),
  gallery_en = coalesce(gallery_en, '[]'::jsonb),
  faq_en = jsonb_build_object(
    'title', 'Frequently asked questions',
    'items', jsonb_build_array(
      jsonb_build_object('question', 'Can you combine LED and projection?', 'answer', 'Yes, hybrid setups are supported when useful for the scenario.'),
      jsonb_build_object('question', 'Do you provide operators?', 'answer', 'Yes, operators and technical support are available for the full event window.'),
      jsonb_build_object('question', 'How is cost estimated?', 'answer', 'By screen size, routing complexity, playback tasks, and operation time.')
    )
  ),
  bottom_cta_en = jsonb_build_object(
    'title', 'Need a reliable video setup?',
    'text', 'Share your event format and venue data. We will offer a practical video architecture and estimate.',
    'primaryCta', 'Request quote',
    'secondaryCta', 'Discuss requirements'
  )
WHERE slug = 'video';

UPDATE public.rental_categories
SET
  name_en = 'Sound Equipment',
  short_name_en = 'Sound',
  seo_en = jsonb_build_object(
    'title', 'Sound Equipment Rental - Future Screen',
    'description', 'Professional sound rental: PA systems, microphones, mixers, and monitoring.'
  ),
  hero_en = jsonb_build_object(
    'title', 'Sound Equipment Rental',
    'subtitle', 'Reliable audio coverage for conferences, concerts, and public events.',
    'ctaPrimary', 'Request quote',
    'ctaSecondary', 'Get consultation',
    'highlights', jsonb_build_array(
      jsonb_build_object('text', 'Venue-specific PA design'),
      jsonb_build_object('text', 'Wireless and wired microphone systems'),
      jsonb_build_object('text', 'Live mixing support')
    ),
    'showBlurTitle', coalesce((hero ->> 'showBlurTitle')::boolean, true)
  ),
  about_en = jsonb_build_object(
    'title', 'About this category',
    'text', 'High-quality audio keeps speakers clear and music balanced for every listener. We assemble sound systems according to audience size and acoustic constraints.',
    'items', jsonb_build_array(
      'Line arrays and point-source systems',
      'Digital and analog mixers',
      'Wireless microphones and in-ear monitoring',
      'System processing and tuning'
    )
  ),
  use_cases_en = jsonb_build_array(
    jsonb_build_object('title', 'Business events', 'description', 'Speech intelligibility for conference and forum sessions'),
    jsonb_build_object('title', 'Concerts', 'description', 'Main and monitor systems for performers and audience'),
    jsonb_build_object('title', 'City events', 'description', 'Distributed coverage for open spaces')
  ),
  service_includes_en = jsonb_build_object(
    'title', 'What is included',
    'items', jsonb_build_array(
      'Audio system planning',
      'Delivery and installation',
      'System check and tuning',
      'On-site engineer support'
    )
  ),
  benefits_en = jsonb_build_object(
    'title', 'Benefits',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Consistent coverage', 'description', 'Coverage is designed for the full audience area'),
      jsonb_build_object('title', 'Speech clarity', 'description', 'Microphone chain and processing are tuned for intelligibility'),
      jsonb_build_object('title', 'Operational safety', 'description', 'Critical components can be reserved for fault tolerance')
    )
  ),
  gallery_en = coalesce(gallery_en, '[]'::jsonb),
  faq_en = jsonb_build_object(
    'title', 'Frequently asked questions',
    'items', jsonb_build_array(
      jsonb_build_object('question', 'Can you handle both speech and music?', 'answer', 'Yes, we tailor the setup for mixed event programs.'),
      jsonb_build_object('question', 'Is tuning included?', 'answer', 'Yes, tuning and pre-event checks are part of delivery.'),
      jsonb_build_object('question', 'Do you support multi-day events?', 'answer', 'Yes, with on-site engineer schedules aligned to the program.')
    )
  ),
  bottom_cta_en = jsonb_build_object(
    'title', 'Need stable event audio?',
    'text', 'Send your event details and we will prepare a sound setup proposal with budget.',
    'primaryCta', 'Request quote',
    'secondaryCta', 'Talk to audio engineer'
  )
WHERE slug = 'sound';

UPDATE public.rental_categories
SET
  name_en = 'Stages and Podiums',
  short_name_en = 'Stages',
  seo_en = jsonb_build_object(
    'title', 'Stage and Podium Rental - Future Screen',
    'description', 'Stage structures, podiums, portals, and support constructions for events.'
  ),
  hero_en = jsonb_build_object(
    'title', 'Stage and Podium Rental',
    'subtitle', 'Safe and adaptable stage infrastructure for indoor and outdoor events.',
    'ctaPrimary', 'Request quote',
    'ctaSecondary', 'Discuss layout',
    'highlights', jsonb_build_array(
      jsonb_build_object('text', 'Modular stage systems'),
      jsonb_build_object('text', 'Rigging and support structures'),
      jsonb_build_object('text', 'Installation by experienced crew')
    ),
    'showBlurTitle', coalesce((hero ->> 'showBlurTitle')::boolean, true)
  ),
  about_en = jsonb_build_object(
    'title', 'About this category',
    'text', 'Stage infrastructure is the physical foundation of event production. We supply structures that match format, load requirements, and safety constraints.',
    'items', jsonb_build_array(
      'Stage decks and risers',
      'Podiums and custom platforms',
      'Portals and support towers',
      'Barriers and safety elements'
    )
  ),
  use_cases_en = jsonb_build_array(
    jsonb_build_object('title', 'Concert stages', 'description', 'Main-stage layouts with load-appropriate structures'),
    jsonb_build_object('title', 'Forum halls', 'description', 'Podiums and speaking zones for business events'),
    jsonb_build_object('title', 'City events', 'description', 'Outdoor structures for public programs')
  ),
  service_includes_en = jsonb_build_object(
    'title', 'What is included',
    'items', jsonb_build_array(
      'Layout planning and structural selection',
      'Delivery and installation',
      'Safety checks and handover',
      'Dismantling after event'
    )
  ),
  benefits_en = jsonb_build_object(
    'title', 'Benefits',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Safe structures', 'description', 'Layouts are assembled to operational requirements'),
      jsonb_build_object('title', 'Flexible geometry', 'description', 'Configuration scales with event scenario'),
      jsonb_build_object('title', 'Integrated setup', 'description', 'Compatible with lighting, audio, and video zones')
    )
  ),
  gallery_en = coalesce(gallery_en, '[]'::jsonb),
  faq_en = jsonb_build_object(
    'title', 'Frequently asked questions',
    'items', jsonb_build_array(
      jsonb_build_object('question', 'Can stage size be customized?', 'answer', 'Yes, modular elements allow flexible dimensions and levels.'),
      jsonb_build_object('question', 'Do you support outdoor projects?', 'answer', 'Yes, we provide solutions for open-air formats with proper constraints.'),
      jsonb_build_object('question', 'Is dismantling included?', 'answer', 'Yes, dismantling is included in standard service flow.')
    )
  ),
  bottom_cta_en = jsonb_build_object(
    'title', 'Need a stage layout for your event?',
    'text', 'Share your scenario and venue details. We will propose a safe and efficient stage configuration.',
    'primaryCta', 'Request quote',
    'secondaryCta', 'Get technical plan'
  )
WHERE slug = 'stage';

UPDATE public.rental_categories
SET
  name_en = 'Musical Instruments',
  short_name_en = 'Instruments',
  seo_en = jsonb_build_object(
    'title', 'Musical Instrument Rental - Future Screen',
    'description', 'Backline and musical instrument rental for live performances and rehearsals.'
  ),
  hero_en = jsonb_build_object(
    'title', 'Musical Instrument Rental',
    'subtitle', 'Backline and instrument sets tailored to lineup and performance format.',
    'ctaPrimary', 'Request quote',
    'ctaSecondary', 'Check availability',
    'highlights', jsonb_build_array(
      jsonb_build_object('text', 'Genre-specific equipment sets'),
      jsonb_build_object('text', 'Pre-event maintenance and setup'),
      jsonb_build_object('text', 'Delivery and logistics support')
    ),
    'showBlurTitle', coalesce((hero ->> 'showBlurTitle')::boolean, true)
  ),
  about_en = jsonb_build_object(
    'title', 'About this category',
    'text', 'Reliable instruments and backline are essential for smooth performances. We supply configured sets for different stage and artist requirements.',
    'items', jsonb_build_array(
      'Keyboards and stage pianos',
      'Drum kits and percussion',
      'Guitar and bass backline',
      'Accessories and stands'
    )
  ),
  use_cases_en = jsonb_build_array(
    jsonb_build_object('title', 'Live concerts', 'description', 'Complete backline support for performers'),
    jsonb_build_object('title', 'Festivals', 'description', 'Fast changeovers and robust setups'),
    jsonb_build_object('title', 'Corporate events', 'description', 'Compact live-music configurations')
  ),
  service_includes_en = jsonb_build_object(
    'title', 'What is included',
    'items', jsonb_build_array(
      'Equipment selection by rider',
      'Delivery and stage placement',
      'Pre-show check and tuning',
      'Post-event pickup'
    )
  ),
  benefits_en = jsonb_build_object(
    'title', 'Benefits',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Rider-oriented sets', 'description', 'Selection aligned with artist and program needs'),
      jsonb_build_object('title', 'Operational readiness', 'description', 'Equipment is checked before handover'),
      jsonb_build_object('title', 'Convenient logistics', 'description', 'Delivery and return are handled by one team')
    )
  ),
  gallery_en = coalesce(gallery_en, '[]'::jsonb),
  faq_en = jsonb_build_object(
    'title', 'Frequently asked questions',
    'items', jsonb_build_array(
      jsonb_build_object('question', 'Can you assemble by rider?', 'answer', 'Yes, we assemble instrument lists according to rider requirements.'),
      jsonb_build_object('question', 'Do you provide setup support?', 'answer', 'Yes, setup and pre-show checks are included.'),
      jsonb_build_object('question', 'Is short-term rental possible?', 'answer', 'Yes, one-day and multi-day options are both available.')
    )
  ),
  bottom_cta_en = jsonb_build_object(
    'title', 'Need backline for your show?',
    'text', 'Send your performer list and schedule. We will prepare an instrument package and estimate.',
    'primaryCta', 'Request quote',
    'secondaryCta', 'Share rider'
  )
WHERE slug = 'instruments';

UPDATE public.rental_categories
SET
  name_en = 'Computers and Laptops',
  short_name_en = 'Computers',
  seo_en = jsonb_build_object(
    'title', 'Computer and Laptop Rental - Future Screen',
    'description', 'Workstation and laptop rental for event operations, registration, and control rooms.'
  ),
  hero_en = jsonb_build_object(
    'title', 'Computers and Laptop Rental',
    'subtitle', 'Prepared hardware for event workflows, control points, and temporary offices.',
    'ctaPrimary', 'Request quote',
    'ctaSecondary', 'Get consultation',
    'highlights', jsonb_build_array(
      jsonb_build_object('text', 'Flexible hardware sets'),
      jsonb_build_object('text', 'Pre-configured OS and software'),
      jsonb_build_object('text', 'Delivery and support')
    ),
    'showBlurTitle', coalesce((hero ->> 'showBlurTitle')::boolean, true)
  ),
  about_en = jsonb_build_object(
    'title', 'About this category',
    'text', 'Temporary event teams often need ready-to-run computing resources. We provide configured laptops and PCs for production, registration, and administration tasks.',
    'items', jsonb_build_array(
      'Laptops for staff and operators',
      'Desktop stations for control rooms',
      'Peripherals and adapters',
      'Network-ready configurations'
    )
  ),
  use_cases_en = jsonb_build_array(
    jsonb_build_object('title', 'Registration desks', 'description', 'Reliable stations for attendee check-in'),
    jsonb_build_object('title', 'Production control', 'description', 'Operator workstations for media and technical teams'),
    jsonb_build_object('title', 'Temporary offices', 'description', 'Short-term hardware for event administration')
  ),
  service_includes_en = jsonb_build_object(
    'title', 'What is included',
    'items', jsonb_build_array(
      'Hardware selection by scenario',
      'Basic setup and testing',
      'Delivery to venue',
      'Collection after event'
    )
  ),
  benefits_en = jsonb_build_object(
    'title', 'Benefits',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Ready-to-use hardware', 'description', 'Devices are prepared before delivery'),
      jsonb_build_object('title', 'Scalable quantity', 'description', 'From single units to multi-station sets'),
      jsonb_build_object('title', 'Unified support', 'description', 'One team handles delivery and operations')
    )
  ),
  gallery_en = coalesce(gallery_en, '[]'::jsonb),
  faq_en = jsonb_build_object(
    'title', 'Frequently asked questions',
    'items', jsonb_build_array(
      jsonb_build_object('question', 'Can software be preinstalled?', 'answer', 'Yes, required software can be prepared before delivery.'),
      jsonb_build_object('question', 'Do you provide peripherals?', 'answer', 'Yes, keyboards, mice, adapters, and monitors can be included.'),
      jsonb_build_object('question', 'Do you support urgent requests?', 'answer', 'Yes, subject to stock and logistics windows.')
    )
  ),
  bottom_cta_en = jsonb_build_object(
    'title', 'Need computers for your event team?',
    'text', 'Send your required quantity and task profile. We will prepare a matching hardware set.',
    'primaryCta', 'Request quote',
    'secondaryCta', 'Get hardware plan'
  )
WHERE slug = 'computers';

UPDATE public.rental_categories
SET
  name_en = 'Touchscreens and Displays',
  short_name_en = 'Touchscreens',
  seo_en = jsonb_build_object(
    'title', 'Touchscreen and Display Rental - Future Screen',
    'description', 'Interactive screens and display rental for events, exhibitions, and information zones.'
  ),
  hero_en = jsonb_build_object(
    'title', 'Touchscreen and Display Rental',
    'subtitle', 'Interactive and informational display systems for engagement and navigation.',
    'ctaPrimary', 'Request quote',
    'ctaSecondary', 'Discuss setup',
    'highlights', jsonb_build_array(
      jsonb_build_object('text', 'Interactive event scenarios'),
      jsonb_build_object('text', 'Display walls and standalone screens'),
      jsonb_build_object('text', 'Content-ready deployment')
    ),
    'showBlurTitle', coalesce((hero ->> 'showBlurTitle')::boolean, true)
  ),
  about_en = jsonb_build_object(
    'title', 'About this category',
    'text', 'Touch and display solutions improve navigation, self-service, and audience engagement at events and exhibitions.',
    'items', jsonb_build_array(
      'Interactive touch displays',
      'Information kiosks',
      'Digital signage screens',
      'Presentation monitors'
    )
  ),
  use_cases_en = jsonb_build_array(
    jsonb_build_object('title', 'Exhibitions', 'description', 'Interactive product catalogs and lead capture points'),
    jsonb_build_object('title', 'Forums', 'description', 'Navigation and information screens for attendees'),
    jsonb_build_object('title', 'Brand activations', 'description', 'Touch mechanics for audience interaction')
  ),
  service_includes_en = jsonb_build_object(
    'title', 'What is included',
    'items', jsonb_build_array(
      'Hardware and stand selection',
      'Delivery and assembly',
      'Basic software/content setup',
      'Operational support'
    )
  ),
  benefits_en = jsonb_build_object(
    'title', 'Benefits',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Interactive experience', 'description', 'Supports modern engagement scenarios'),
      jsonb_build_object('title', 'Fast deployment', 'description', 'Ready-to-use kits for event timelines'),
      jsonb_build_object('title', 'Flexible placement', 'description', 'Solutions for entrance, hall, and booth zones')
    )
  ),
  gallery_en = coalesce(gallery_en, '[]'::jsonb),
  faq_en = jsonb_build_object(
    'title', 'Frequently asked questions',
    'items', jsonb_build_array(
      jsonb_build_object('question', 'Can content be customized?', 'answer', 'Yes, content and interaction logic can be configured to your scenario.'),
      jsonb_build_object('question', 'Do screens include stands?', 'answer', 'Yes, mounting and stand options are selected per layout.'),
      jsonb_build_object('question', 'Can you support multi-day events?', 'answer', 'Yes, we provide support for extended event schedules.')
    )
  ),
  bottom_cta_en = jsonb_build_object(
    'title', 'Need interactive screens for your event?',
    'text', 'Tell us your use case and venue. We will propose a practical display setup and estimate.',
    'primaryCta', 'Request quote',
    'secondaryCta', 'Discuss scenario'
  )
WHERE slug = 'touchscreens';

UPDATE public.rental_categories
SET
  name_en = 'Event Staff',
  short_name_en = 'Staff',
  seo_en = jsonb_build_object(
    'title', 'Event Technical Staff - Future Screen',
    'description', 'Technical staff rental for setup, operation, and event production support.'
  ),
  hero_en = jsonb_build_object(
    'title', 'Event Technical Staff',
    'subtitle', 'Experienced specialists for installation, operation, and production workflows.',
    'ctaPrimary', 'Request quote',
    'ctaSecondary', 'Discuss team',
    'highlights', jsonb_build_array(
      jsonb_build_object('text', 'Stagehands and technical operators'),
      jsonb_build_object('text', 'Audio, video, and lighting specialists'),
      jsonb_build_object('text', 'Shift-based support model')
    ),
    'showBlurTitle', coalesce((hero ->> 'showBlurTitle')::boolean, true)
  ),
  about_en = jsonb_build_object(
    'title', 'About this category',
    'text', 'Qualified technical staff is essential for stable event execution. We provide specialists for setup, operation, and backstage coordination.',
    'items', jsonb_build_array(
      'Stagehands and rigging support',
      'Audio/video/light operators',
      'Technical coordinators',
      'Shift support for multi-day events'
    )
  ),
  use_cases_en = jsonb_build_array(
    jsonb_build_object('title', 'Setup and dismantling', 'description', 'Skilled crews for assembly and teardown'),
    jsonb_build_object('title', 'Live operation', 'description', 'Operators and technical staff during event runtime'),
    jsonb_build_object('title', 'Large productions', 'description', 'Shift-based staffing for complex schedules')
  ),
  service_includes_en = jsonb_build_object(
    'title', 'What is included',
    'items', jsonb_build_array(
      'Role-based staffing plan',
      'Shift schedule coordination',
      'On-site supervision',
      'Integration with technical teams'
    )
  ),
  benefits_en = jsonb_build_object(
    'title', 'Benefits',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Experienced specialists', 'description', 'Teams with practical event production background'),
      jsonb_build_object('title', 'Operational flexibility', 'description', 'Staffing scales to event complexity and timeline'),
      jsonb_build_object('title', 'Reliable execution', 'description', 'Clear role distribution and technical coordination')
    )
  ),
  gallery_en = coalesce(gallery_en, '[]'::jsonb),
  faq_en = jsonb_build_object(
    'title', 'Frequently asked questions',
    'items', jsonb_build_array(
      jsonb_build_object('question', 'Can staffing be provided for one day?', 'answer', 'Yes, one-day and multi-day staffing options are available.'),
      jsonb_build_object('question', 'Do you provide supervisors?', 'answer', 'Yes, coordinator roles can be included for complex projects.'),
      jsonb_build_object('question', 'Can team size be adjusted quickly?', 'answer', 'Yes, staffing can be adjusted according to approved plan and availability.')
    )
  ),
  bottom_cta_en = jsonb_build_object(
    'title', 'Need technical staff for your event?',
    'text', 'Share your event schedule and workload. We will propose a staffing model and estimate.',
    'primaryCta', 'Request quote',
    'secondaryCta', 'Discuss staffing'
  )
WHERE slug = 'staff';

