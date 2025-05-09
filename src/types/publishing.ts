
// Types related to published applications and their components
export interface PublishedApplication {
  id: string;
  name: string;
  description: string;
  published_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  version?: string;
  application_id?: string;
  is_active?: boolean;
  publisher?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  objects?: PublishedObject[];
  actions?: PublishedAction[];
  fields?: PublishedField[];
}

export interface PublishedObject {
  id: string;
  published_application_id: string;
  object_type_id: string;
  is_included: boolean;
  created_at: string;
  updated_at: string;
  object_type: {
    id: string;
    name: string;
    api_name: string;
    description?: string;
  };
  fields?: PublishedField[];
}

export interface PublishedAction {
  id: string;
  published_application_id: string;
  action_id: string;
  is_included: boolean;
  created_at: string;
  updated_at: string;
  action: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface PublishedField {
  id: string;
  object_type_id: string;
  field_id: string; 
  field_api_name?: string;
  is_included: boolean;
  created_at: string;
  updated_at: string;
  field?: {
    id: string;
    name: string;
    api_name: string;
    data_type: string;
  };
}

export interface PublishApplicationParams {
  name: string;
  description: string;
  isPublic: boolean;
  objectTypeIds: string[];
  actionIds: string[];
  fieldSettings?: Record<string, Record<string, boolean>>;
  version?: string;
  applicationId?: string;
}

export interface UpdatePublishedApplicationParams extends PublishApplicationParams {
  id: string;
}
