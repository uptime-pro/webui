export interface Tag {
  id: number;
  userId: number;
  name: string;
  color: string;
}

export interface CreateTagDto {
  name: string;
  color: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}
