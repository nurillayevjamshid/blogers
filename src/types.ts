export type CollaborationType='barter'|'paid'; export type BrandType='mio_beauty'|'mio_home'; export type BloggerStatus='pending'|'completed'; export type Role='admin'|'viewer';
export interface CollaborationHistoryItem{id:string;date:string;collaborationType:CollaborationType;brand:BrandType;status:BloggerStatus;createdAt:string;completedAt?:string|null;manager?:string}
export interface Blogger{id:string;nickname:string;date:string;collaborationType:CollaborationType;brand:BrandType;status:BloggerStatus;createdAt:string;completedAt?:string|null;manager?:string;history?:CollaborationHistoryItem[]}
export interface Session{username:string;role:Role;token:string}
