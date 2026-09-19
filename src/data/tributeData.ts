import { Memory, Wish } from '../types';

export const TRIBUTE_PROFILE = {
  name: 'Idris Abdulrazaq Oluwatoyin',
  formalTitle: 'Alhaji Idris Abdulrazaq Oluwatoyin',
  roleBadge: 'Patriarch & Guide',
  birthday: 'September 19',
  heroHeadline: 'Happy Birthday, Dad! 👑',
  heroIntro:
    'Today we celebrate an extraordinary father, a steadfast source of quiet strength, boundless love, timeless wisdom, and enduring inspiration.',
  heroPortrait: '/hero_portrait.jpg',
  heroPortraitAlt:
    'Alhaji Idris Abdulrazaq Oluwatoyin smiling warmly in traditional gold embroidered fila and ornate white agbada',
  metrics: [
    { title: 'Grace', subtitle: 'Unwavering Faith' },
    { title: 'Wisdom', subtitle: 'Lifelong Counsel' },
    { title: 'Legacy', subtitle: 'Generations Blessed' },
  ],
  aboutTitle: 'A Man of Substance, Honor, and Heart',
  aboutSubtitle: 'Our Patriarch & Pillar of Grace',
  aboutCaption: 'A life devoted to service, integrity, and family unity.',
  aboutBio:
    'To know Idris Abdulrazaq Oluwatoyin is to witness quiet dignity in motion. Through every chapter of his life, he has stood tall as the compass for his family, extending kindness to neighbors, mentorship to the young, and unwavering fidelity to his values.',
  quote:
    '“A father doesn’t just tell you how to live; he lives quietly and lets you watch him do it with grace.”',
  familyNote: {
    title: 'To Our Amazing Dad ❤️',
    subtitle: 'An Eternal Letter of Honor',
    paragraphs: [
      'Dad, words often fall short when trying to express the boundless depth of our gratitude. From the countless sacrifices you made in quiet perseverance to the resounding joy and confidence you bring into every room you enter, you have been our unwavering guiding light.',
      'You showed us that greatness is measured not by loud clamor, but by steady hands, faithful prayers, and kindness shown to those who cannot repay you. Whenever winds blew fierce, your reassurance was our shelter. Whenever dreams felt distant, your steadfast faith in our abilities gave us courage to soar.',
      'As you celebrate this precious birthday on September 19, know that you are deeply cherished, endlessly revered, and celebrated beyond measure. May God reward every drop of sweat you gave for us with radiant health, peace of mind, long life, and abundant laughter.',
    ],
    signature: 'The Idris Family',
    signatureSub: 'With all our love and deepest respect',
    date: 'September 19, 2024',
  },
};

export const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'memory-1',
    title: 'Family Milestones & Anniversaries',
    description:
      'Surrounded by children and grandchildren, laughing over vintage photo albums and timeless stories.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDt81EZmwVptI5zgEJg5QpKkPWn_8zMAKzk7KosT6XbT9Ftfa_kj8CeWfwDbVG2tp8oEPhCAfNJcxu1WSr6ysX8rNu-AGAF3LQq4OR_KCmemhdR2vxff_04tWH2qR8ncziA-cMVzXWYie8i-OwxTUCupfSVtzNGUvkrZu0K3IR5796okuQ5jbhzHTGFUNqjLVuxEHIuDk31SIiGmPjj5VPiO0wlx0EW-_lAdDmFgo9ylzMHYUibKQw',
    category: 'Milestone',
    location: 'Lagos, Nigeria',
    badge: 'Cherished Archive',
    alt: 'Distinguished African father in tailored royal blue agbada during family celebration banquet',
  },
  {
    id: 'memory-2',
    title: 'Mentorship & Joyful Conversations',
    description:
      'Quiet Sunday mornings listening to his guidance on life, career, leadership, and holding high standards.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBnFarUpAjnF4PVUi0hpIIhcktGJluiM2jkeYzqurFmiGs2W7Q3broYRR8iSiMXlJCrFpL8uHWra_1QPMGsNc6umOUp5LfV2Rc65hp_jXoHxDAEx789Yn6PLLJgN-HccGS7BiZxonrjpY0UEEXKcUvtDVqP2x6Zi20mCfVVNwqnikq1_9dS1nfhwYaGDuc-Dd0wJ9oXNOHG8_UB3JhiRBRnhsRLktvjLFdAtWvroHktjceOzJyAlwE',
    category: 'Counsel',
    location: 'The Study',
    badge: 'Everyday Grace',
    alt: 'African father enjoying deep conversation and tea with adult son and daughter',
  },
  {
    id: 'memory-3',
    title: 'Celebrations in Lagos & Beyond',
    description:
      'The room always lights up whenever Dad takes the floor, reminding us all of the value of pure celebration.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC7-GMzHzmepBY0St5WYpySTCUKlTIDxHzOcWk1R0OmWrvf22wcnn00KoRhTz55g0QojY7gUfcLN4O4wWuzdqQ4prHzS7LblBYyPts8NFlU0nWNEGSZYiyEJEh8ENjdVKAqQWd90d9u1P_o3yDh-YM9LhSMG5dOKuDGr7Av1psQTugoM1wYnRMJQlKBC5GcETGDqwtcwKnLs2yVv4bFh--bOdyw4Y66cH5EslDUM2FxP0L_nVzsEPM',
    category: 'Celebration',
    location: 'Festivities',
    badge: 'Unmatched Energy',
    alt: 'Joyful cultural celebration with regal Nigerian native attire and music',
  },
  {
    id: 'memory-4',
    title: 'The Warmest Smiles at Home',
    description:
      'Grandpa’s legendary bedtime folk tales and treats that he secretly hands out when mothers aren’t looking.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDy7qe6Vhkc-WfYqECPK_kk-xm_x7hwUaoAYQ0n8MaCGWY3jqK89h833RNyKHsgt1auaObZIOacT5-8gVk3wC91IZfAE5QBd1OcrbvVQsj3XEfWbqP--OLWIekxsQnRs94FGRRjfu7PBp-VL_pJieK4jJ2zWMLj8Scms5iVGiOv9kfAnJ2xEZFEB_N4JM8aCusyHMUpk4Km5Wj3LNg-utOmvJC5Y0qWREMVJ9Qh7PtBFLUSJclDYxo',
    category: 'Grandpa',
    location: 'Family Hearth',
    badge: 'Pure Affection',
    alt: 'Grandpa reading a storybook with granddaughter in morning light',
  },
  {
    id: 'memory-5',
    title: 'Wisdom Across Generations',
    description:
      'Passing the torch of discipline, humility, faith, and hard work to children and grandchildren alike.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCkovrri4BkraS6a5mp8xHwC-AEjvphc2ytqnwWFJzY-MZ0tN5usheP3bQ4KErWqNd7VrdY_GhvoLOwSxfKk-rm9VV9eJfbbChU48mrCQBnhY25JWEWe_x-xjXJAqaqaQqPr3YT6mnlWrUnUwW9Mgs01zHJbM00wfU3yzp6EKMFAjUGV1AXkRrX8JLGXWjBHbXT67Pz4F-g0um88HhwW2dEpffmMz1p5ThxOx8_ZJ5uYMUrIFiT-vs',
    category: 'Generations',
    location: 'Family Reunion',
    badge: 'Legacy Continuous',
    alt: 'Multi-generational family gathered around outdoor table at twilight',
  },
  {
    id: 'memory-6',
    title: 'Triumphs & Everyday Blessings',
    description:
      'Reflecting on God’s endless grace, good health, and peace of mind on this grand September milestone.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDt4Lq18G-Ei0uLrP33O5qZs3x2GAdJ5ng_sN9bloPRhPYabOq6Z1YHbjFl152jlBiBV6ZOo3nVMusKnmRKxpsMN_62G9yN2hRh8IDdJVe14H91XxHNx1K64TOkSxqhfG2NcXnx_uNYB806rncnQoVw_IaY2ayo0bkt_VAGdNSl9a9_D8zgsAso40Ld6prJ7KXG6pcjVKOlhbl9CbNy4l_CoKPtWKqFFN-T7MLCU3rMv2iIFoUWyU',
    category: 'Serenity',
    location: 'Solitude & Prayer',
    badge: 'Grateful Heart',
    alt: 'Distinguished gentleman walking in a tranquil serene garden in morning sunlight',
  },
];

export const INITIAL_WISHES: Wish[] = [
  {
    id: 'wish-1',
    name: 'Adebayo & Tolu Idris',
    relationship: 'Children',
    message:
      'Happy Birthday Daddy! Your guidance, steadfast love, and tireless prayers have shaped the people we have become. May the Almighty grant you many more prosperous, vibrant, and healthy years. We love you endlessly!',
    createdAt: 'September 19, 2024 • Morning Tribute',
    approved: true,
    reactionsCount: 24,
    badge: 'Children',
  },
  {
    id: 'wish-2',
    name: 'Dr. Funmilayo Alabi',
    relationship: 'Sister',
    message:
      'To my dearest brother Idris, your kindness knows no bounds. You have always been the anchor of our extended family. Wishing you deep inner peace, unceasing joy, and total vitality today and forever!',
    createdAt: 'September 19, 2024 • Family Blessing',
    approved: true,
    reactionsCount: 18,
    badge: 'Sister',
  },
  {
    id: 'wish-3',
    name: 'Engr. Kayode Balogun',
    relationship: 'Lifelong Friend',
    message:
      'Celebrating a true gentleman, an astute mind, and a brother by choice. May your 60s and beyond be your most fulfilling, peaceful, and joy-filled years yet. Cheers to life and friendship, Idris!',
    createdAt: 'September 19, 2024 • Brotherhood',
    approved: true,
    reactionsCount: 15,
    badge: 'Lifelong Friend',
  },
  {
    id: 'wish-4',
    name: 'Little Zara',
    relationship: 'Granddaughter',
    message:
      'Happy Birthday Grandpa! 🎂 Thank you for all the sweet bedtime stories and giving me the biggest, warmest hugs in the whole wide world! I love you to the moon and all the stars!',
    createdAt: 'September 19, 2024 • Sweet Grandchild Wish',
    approved: true,
    reactionsCount: 32,
    badge: 'Granddaughter',
  },
];
