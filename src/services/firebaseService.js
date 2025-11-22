// src/services/firebaseService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Employee Management
export const getEmployeeByEmail = async (email) => {
  try {
    const q = query(collection(db, 'employees'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting employee:', error);
    throw error;
  }
};

export const getAllEmployees = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'employees'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

export const createEmployee = async (employeeData) => {
  try {
    const docRef = await addDoc(collection(db, 'employees'), {
      ...employeeData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

// Leave Requests
export const submitLeaveRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'leaveRequests'), {
      ...requestData,
      status: 'Pending',
      submissionDate: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error submitting leave request:', error);
    throw error;
  }
};

export const getLeaveRequestsByEmployee = async (employeeId) => {
  try {
    const q = query(
      collection(db, 'leaveRequests'), 
      where('employeeId', '==', employeeId),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting leave requests:', error);
    throw error;
  }
};

export const getLeaveRequestsByDepartment = async (department) => {
  try {
    const q = query(
      collection(db, 'leaveRequests'), 
      where('department', '==', department),
      where('status', '==', 'Pending'),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting department leave requests:', error);
    throw error;
  }
};

// Overtime Requests
export const submitOvertimeRequest = async (requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'overtimeRequests'), {
      ...requestData,
      status: 'Pending',
      submissionDate: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error submitting overtime request:', error);
    throw error;
  }
};

export const getOvertimeRequestsByEmployee = async (employeeId) => {
  try {
    const q = query(
      collection(db, 'overtimeRequests'), 
      where('employeeId', '==', employeeId),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting overtime requests:', error);
    throw error;
  }
};

export const getOvertimeRequestsByDepartment = async (department) => {
  try {
    const q = query(
      collection(db, 'overtimeRequests'), 
      where('department', '==', department),
      where('status', '==', 'Pending'),
      orderBy('submissionDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting department overtime requests:', error);
    throw error;
  }
};

// Request Management
export const updateRequestStatus = async (requestId, status, type, approvedBy) => {
  try {
    const collectionName = type === 'Leave' ? 'leaveRequests' : 'overtimeRequests';
    const requestRef = doc(db, collectionName, requestId);
    await updateDoc(requestRef, {
      status,
      approvedBy,
      approvedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
};

// HR Functions
export const getAllRequests = async () => {
  try {
    const [leaveSnapshot, overtimeSnapshot] = await Promise.all([
      getDocs(collection(db, 'leaveRequests')),
      getDocs(collection(db, 'overtimeRequests'))
    ]);

    const leaveRequests = leaveSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'Leave',
      ...doc.data()
    }));

    const overtimeRequests = overtimeSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'Overtime',
      ...doc.data()
    }));

    return [...leaveRequests, ...overtimeRequests];
  } catch (error) {
    console.error('Error getting all requests:', error);
    throw error;
  }
};

// Real-time Listeners
export const subscribeToDepartmentRequests = (department, callback) => {
  const leaveQuery = query(
    collection(db, 'leaveRequests'),
    where('department', '==', department),
    where('status', '==', 'Pending')
  );

  const overtimeQuery = query(
    collection(db, 'overtimeRequests'),
    where('department', '==', department),
    where('status', '==', 'Pending')
  );

  const unsubscribeLeave = onSnapshot(leaveQuery, (snapshot) => {
    const leaveRequests = snapshot.docs.map(doc => ({
      id: doc.id,
      type: 'Leave',
      ...doc.data()
    }));

    const overtimeUnsubscribe = onSnapshot(overtimeQuery, (overtimeSnapshot) => {
      const overtimeRequests = overtimeSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'Overtime',
        ...doc.data()
      }));

      callback([...leaveRequests, ...overtimeRequests]);
    });

    return () => {
      unsubscribeLeave();
      overtimeUnsubscribe();
    };
  });

  return unsubscribeLeave;
};

