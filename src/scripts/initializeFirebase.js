// src/scripts/initializeFirebase.js
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';

const auth = getAuth();

const employees = [
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@luocityspa.com',
    role: 'Employee',
    department: 'Massage Therapy',
    employeeId: 'MT001',
    position: 'Senior Massage Therapist',
    hireDate: new Date('2023-01-15')
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@luocityspa.com',
    role: 'Employee',
    department: 'Skin Care',
    employeeId: 'SC001',
    position: 'Esthetician',
    hireDate: new Date('2023-03-20')
  },
  {
    name: 'Lisa Chen',
    email: 'lisa.chen@luocityspa.com',
    role: 'Head',
    department: 'Massage Therapy',
    employeeId: 'MTM001',
    position: 'Massage Department Manager',
    hireDate: new Date('2022-05-10')
  },
  {
    name: 'David Kim',
    email: 'david.kim@luocityspa.com',
    role: 'Head',
    department: 'Skin Care',
    employeeId: 'SCM001',
    position: 'Skin Care Manager',
    hireDate: new Date('2022-08-15')
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@luocityspa.com',
    role: 'HR',
    department: 'Human Resources',
    employeeId: 'HR001',
    position: 'HR Manager',
    hireDate: new Date('2021-11-01')
  }
];

export const initializeFirebaseData = async () => {
  try {
    console.log('Initializing Firebase data...');

    // Create employees in Firestore and Auth
    for (const employee of employees) {
      // Add to Firestore
      await addDoc(collection(db, 'employees'), employee);
      
      // Create auth user with default password
      try {
        await createUserWithEmailAndPassword(auth, employee.email, 'spa2024');
        console.log(`Created user: ${employee.email}`);
      } catch (authError) {
        console.log(`User ${employee.email} may already exist:`, authError.message);
      }
    }

    console.log('Firebase data initialization completed!');
    console.log('Default password for all users: spa2024');
  } catch (error) {
    console.error('Error initializing Firebase data:', error);
  }
};

// Run this function once to initialize your data
// initializeFirebaseData();