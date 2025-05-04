
export interface RecordShare {
  id: string;
  record_id: string;
  shared_by_user_id: string;
  shared_with_user_id: string;
  permission_level: 'read' | 'edit';
  created_at: string;
  updated_at: string;
  user_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    screen_name: string | null;
  };
}

export interface RecordShareField {
  id: string;
  record_share_id: string;
  field_api_name: string;
  is_visible: boolean;
}

export interface ShareRecordParams {
  recordId: string;
  sharedWithUserId: string;
  permissionLevel: 'read' | 'edit';
  visibleFields: string[];
}

export interface CollectionShare {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  members: CollectionMember[];
  records: string[];
  fields: CollectionField[];
}

export interface CollectionMember {
  id: string;
  collection_id: string;
  user_id: string;
  permission_level: 'read' | 'edit';
  user_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    screen_name: string | null;
  };
}

export interface CollectionField {
  id: string;
  collection_id: string;
  object_type_id: string;
  field_api_name: string;
}
