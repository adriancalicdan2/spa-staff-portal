// src/initData.js
import { auth, db } from './firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

const employees = [
  {
    name: 'Maria Garcia',
    email: 'maria@luocityspa.com',
    role: 'Employee',
    department: 'Massage Therapy',
    employeeId: 'MT001',
    position: 'Senior Massage Therapist',
    hireDate: new Date('2023-01-15')
  },
  {
    name: 'Lisa Chen',
    email: 'lisa@luocityspa.com',
    role: 'Head',
    department: 'Massage Therapy',
    employeeId: 'MTM001',
    position: 'Massage Department Manager',
    hireDate: new Date('2022-05-10')
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@luocityspa.com',
    role: 'HR',
    department: 'Human Resources',
    employeeId: 'HR001',
    position: 'HR Manager',
    hireDate: new Date('2021-11-01')
  }
];

export const initializeData = async () => {
  try {
    console.log('Initializing Firebase data...');

    for (const employee of employees) {
      try {
        // Create auth user
        await createUserWithEmailAndPassword(auth, employee.email, 'spa2024');
        console.log(`Created auth user: ${employee.email}`);
        
        // Add to Firestore
        await addDoc(collection(db, 'employees'), employee);
        console.log(`Added employee: ${employee.name}`);
      } catch (error) {
        console.log(`User ${employee.email} may already exist:`, error.message);
      }
    }

    console.log('Data initialization completed!');
    console.log('Default password for all users: spa2024');
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

// Run this in browser console to initialize data
// import { initializeData } from './initData';
// initializeData();