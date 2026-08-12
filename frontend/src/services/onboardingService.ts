export interface MonthlyCohortProfile {
  address: string;
  cohortMonth: string;
  isNewMonthlyUser: boolean;
  onboardingStep: number;
  completedOnboarding: boolean;
  joinDate: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionText: string;
}

const STORAGE_KEY_PREFIX = 'aetherscholar_onboarding_';

export const getCurrentCohortMonth = (): string => {
  const date = new Date();
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

export const getOrCreateCohortProfile = (address: string): MonthlyCohortProfile => {
  const currentMonth = getCurrentCohortMonth();
  const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${address}`);
  
  if (saved) {
    try {
      const parsed: MonthlyCohortProfile = JSON.parse(saved);
      const isNewThisMonth = parsed.cohortMonth === currentMonth && parsed.isNewMonthlyUser;
      return {
        ...parsed,
        isNewMonthlyUser: isNewThisMonth
      };
    } catch {
      // Fallback
    }
  }

  const isNewMonthlyUser = true; 
  const newProfile: MonthlyCohortProfile = {
    address,
    cohortMonth: currentMonth,
    isNewMonthlyUser,
    onboardingStep: 0,
    completedOnboarding: false,
    joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  localStorage.setItem(`${STORAGE_KEY_PREFIX}${address}`, JSON.stringify(newProfile));
  return newProfile;
};

export const getOnboardingTasks = (isNewMonthlyUser: boolean): OnboardingTask[] => {
  if (isNewMonthlyUser) {
    return [
      {
        id: 'task-welcome',
        title: 'New Monthly Cohort Welcome',
        description: 'Welcome to the August 2026 onboarding cohort! Claim your 100 XP onboarding badge.',
        completed: false,
        actionText: 'Claim New User Badge'
      },
      {
        id: 'task-tour',
        title: 'Platform Architecture Tour',
        description: 'Learn how decentralized voting, Freighter authentication, and admin approvals operate.',
        completed: false,
        actionText: 'Start Guided Tour'
      },
      {
        id: 'task-proposal',
        title: 'First Scholarship Proposal',
        description: 'As a new monthly member, submit your student application with priority queue review.',
        completed: false,
        actionText: 'Create Application'
      }
    ];
  }

  return [
    {
      id: 'task-returning',
      title: 'Monthly Governance Review',
      description: 'Review active candidate applications for the current monthly cycle.',
      completed: true,
      actionText: 'View Candidates'
    }
  ];
};

export const saveCohortProfile = (profile: MonthlyCohortProfile): void => {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${profile.address}`, JSON.stringify(profile));
};
