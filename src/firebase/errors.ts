// src/firebase/errors.ts
export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `Firestore Permission Denied: The following request was denied by security rules: ${JSON.stringify(context, null, 2)}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
