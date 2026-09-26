export const lessons = [
  {
    id: 'right-to-learn', title: 'Every Child Can Learn', category: 'Education', icon: '🎒', color: '#5B5CE2', minutes: 5, level: 'Starter',
    summary: 'Understand why school, learning, and being treated fairly matter.',
    sections: [
      { heading: 'Learning is a right', body: 'In India, the Right of Children to Free and Compulsory Education Act, often called the RTE Act, supports free and compulsory elementary education for children aged 6 to 14. Education helps children grow, ask questions, and plan their futures.', tip: 'If school feels difficult, speak to a teacher, parent, or another trusted adult. Asking for support is a strong step.' },
      { heading: 'A welcoming school', body: 'Every child deserves to be treated with dignity at school. That includes children of every gender, background, language, ability, and family situation. Bullying, discrimination, and unsafe behaviour should be taken seriously.', tip: 'You can report a problem to a teacher, principal, school counsellor, or trusted adult.' },
      { heading: 'Your voice matters', body: 'Children can share their views about things that affect them. Listening respectfully and speaking up safely are important skills at home, at school, and in the community.', tip: 'Try saying: “I need help with something that happened at school.”' }
    ]
  },
  {
    id: 'personal-safety', title: 'Personal Safety & Trusted Help', category: 'Safety', icon: '🛡️', color: '#F06C75', minutes: 6, level: 'Starter',
    summary: 'Learn safe boundaries, trusted adults, and what to do if something feels wrong.',
    sections: [
      { heading: 'Your body belongs to you', body: 'You have a right to feel safe. It is okay to say “no”, move away, and get help if a touch, message, request, or situation makes you uncomfortable, scared, or confused. It is never a child’s fault when someone crosses a boundary.', tip: 'Trust your feelings. You do not need to keep a secret that makes you worried or unsafe.' },
      { heading: 'Tell a trusted adult', body: 'A trusted adult can be a parent, caregiver, teacher, counsellor, doctor, or another adult who listens and helps keep you safe. If one person does not listen, keep telling another trusted adult until you get help.', tip: 'In an immediate emergency in India, call 112 or ask an adult nearby to call. Children can also seek support through Child Helpline 1098.' },
      { heading: 'Protection under the law', body: 'The POCSO Act protects every person below 18 years of age from sexual offences. Its purpose is protection and support. Legal details can be complex, so children should ask a trusted adult or qualified support service for help.', tip: 'SafeBuddy teaches awareness, not legal advice. In a safety concern, reach out to a trusted adult or emergency support.' }
    ]
  },
  {
    id: 'safe-childhood', title: 'A Safe Childhood', category: 'Protection', icon: '🌱', color: '#1D9E75', minutes: 5, level: 'Explorer',
    summary: 'Recognise that children should grow, play, learn, and be protected from harmful work.',
    sections: [
      { heading: 'Time to grow and play', body: 'Children need time for school, rest, play, friends, and family. Harmful work can interfere with health, learning, and childhood. Adults and communities have a responsibility to help keep children safe.', tip: 'If you see a child who seems unsafe or unable to attend school, tell a trusted adult. Do not put yourself in danger.' },
      { heading: 'Child labour protections', body: 'India’s child labour law prohibits employment of children below 14 years and places restrictions on adolescents in hazardous occupations and processes. Rules have details and exceptions, so concerns should be reported to responsible adults or authorities.', tip: 'Being helpful at home is different from work that harms health, safety, or schooling.' },
      { heading: 'Kind actions help', body: 'We can help by avoiding jokes or blame, listening kindly, and encouraging people to seek safe support. Respecting every child’s dignity is everyone’s job.', tip: 'Ask: “Is this child safe, learning, and getting enough time to rest and play?”' }
    ]
  },
  {
    id: 'care-and-justice', title: 'Care, Fairness & Fresh Starts', category: 'Justice', icon: '⚖️', color: '#E6A535', minutes: 6, level: 'Explorer',
    summary: 'Explore how care, protection, and fairness can support children who need help.',
    sections: [
      { heading: 'Children need care and protection', body: 'Some children may need extra support because they are separated from family, facing abuse or neglect, or living in unsafe circumstances. The Juvenile Justice (Care and Protection of Children) Act provides a framework for care, protection, rehabilitation, and reintegration.', tip: 'A child needing help deserves compassion, privacy, and support — never blame.' },
      { heading: 'Fairness means listening', body: 'Children should be treated in ways that respect their age, safety, and dignity. Adults working with children should listen carefully, protect privacy, and choose solutions that support well-being.', tip: 'You can be fair by hearing both sides of a disagreement and asking an adult for help when needed.' },
      { heading: 'Support can make a difference', body: 'Counselling, school support, healthcare, safe accommodation, and caring adults can help children recover and thrive. Asking for help is a courageous action.', tip: 'For urgent danger, seek a trusted adult immediately or call 112 in India.' }
    ]
  }
];

export const quizzes = [
  { id: 'quiz-right-to-learn', lessonId: 'right-to-learn', title: 'Learning Rights Check', xpReward: 30, questions: [
    { prompt: 'What is one healthy step if you are struggling at school?', options: ['Keep it secret forever', 'Talk to a trusted adult or teacher', 'Stop learning completely', 'Blame another student'], answerIndex: 1, explanation: 'Trusted adults and teachers can help you find support.' },
    { prompt: 'Which age group is supported by free and compulsory elementary education under the RTE Act?', options: ['0 to 5', '6 to 14', '15 to 21', 'Only adults'], answerIndex: 1, explanation: 'The RTE Act supports children aged 6 to 14.' },
    { prompt: 'What should a welcoming school do?', options: ['Treat every child with dignity', 'Ignore bullying', 'Exclude children who need help', 'Only listen to adults'], answerIndex: 0, explanation: 'Every child deserves dignity, safety, and inclusion.' }
  ]},
  { id: 'quiz-personal-safety', lessonId: 'personal-safety', title: 'Safety Skills Check', xpReward: 35, questions: [
    { prompt: 'If a situation makes you feel unsafe or confused, what can you do?', options: ['Keep it a secret', 'Say no, move away, and tell a trusted adult', 'Handle it alone', 'Wait for it to disappear'], answerIndex: 1, explanation: 'You have a right to get away and seek trusted help.' },
    { prompt: 'If the first adult does not listen, what is a safe next step?', options: ['Stop asking for help', 'Tell another trusted adult', 'Post private details online', 'Blame yourself'], answerIndex: 1, explanation: 'Keep telling trusted adults until you receive help.' },
    { prompt: 'In India, what number can be called in an immediate emergency?', options: ['101', '112', '123', '999'], answerIndex: 1, explanation: '112 is India’s pan-India emergency number.' }
  ]},
  { id: 'quiz-safe-childhood', lessonId: 'safe-childhood', title: 'Safe Childhood Check', xpReward: 35, questions: [
    { prompt: 'Which activity supports a healthy childhood?', options: ['Learning, rest, and play', 'Unsafe work that stops school', 'Being blamed for adult problems', 'Never asking questions'], answerIndex: 0, explanation: 'Children need opportunities to learn, rest, play, and grow.' },
    { prompt: 'What is a safe response if you notice a child may be unsafe?', options: ['Put yourself in danger', 'Tell a trusted adult', 'Ignore it', 'Share rumours'], answerIndex: 1, explanation: 'Tell a trusted adult or responsible authority without risking your own safety.' },
    { prompt: 'India’s child labour law generally prohibits employment of children below which age?', options: ['10', '12', '14', '18'], answerIndex: 2, explanation: 'The law prohibits employment of children below 14, with details and exceptions in the law.' }
  ]},
  { id: 'quiz-care-and-justice', lessonId: 'care-and-justice', title: 'Care & Fairness Check', xpReward: 40, questions: [
    { prompt: 'A child who needs care and protection deserves:', options: ['Blame', 'Compassion and safe support', 'Gossip', 'Punishment for asking'], answerIndex: 1, explanation: 'Children deserve compassionate, safe, and respectful support.' },
    { prompt: 'What is a fair way to solve a disagreement?', options: ['Listen, stay calm, and ask an adult for help', 'Shout louder', 'Share private information', 'Ignore feelings'], answerIndex: 0, explanation: 'Listening and involving a trusted adult can help keep things fair and safe.' },
    { prompt: 'Which law guides care and protection for children in need in India?', options: ['The Juvenile Justice Act', 'A school timetable', 'A sports rulebook', 'A road map'], answerIndex: 0, explanation: 'The Juvenile Justice (Care and Protection of Children) Act provides this framework.' }
  ]}
];

export const starterUsers = [
  { id: 'admin-safebuddy', name: 'SafeBuddy Guide', email: 'admin@safebuddy.in', role: 'admin', avatar: '🧭', xp: 0, streak: 0, completedLessonIds: [], badges: [] },
  { id: 'learner-aarav', name: 'Aarav Kumar', email: 'aarav@example.com', role: 'learner', avatar: '🦊', xp: 145, streak: 3, completedLessonIds: ['right-to-learn', 'personal-safety'], badges: [{ key: 'first-step', title: 'First Step', icon: '🌟', earnedAt: new Date().toISOString() }, { key: 'safety-scout', title: 'Safety Scout', icon: '🛡️', earnedAt: new Date().toISOString() }] },
  { id: 'learner-meera', name: 'Meera Iyer', email: 'meera@example.com', role: 'learner', avatar: '🐼', xp: 120, streak: 2, completedLessonIds: ['right-to-learn', 'safe-childhood'], badges: [{ key: 'first-step', title: 'First Step', icon: '🌟', earnedAt: new Date().toISOString() }] },
  { id: 'learner-kabir', name: 'Kabir Shah', email: 'kabir@example.com', role: 'learner', avatar: '🐯', xp: 95, streak: 1, completedLessonIds: ['right-to-learn'], badges: [{ key: 'first-step', title: 'First Step', icon: '🌟', earnedAt: new Date().toISOString() }] }
];
