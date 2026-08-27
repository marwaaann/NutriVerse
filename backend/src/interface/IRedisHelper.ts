export interface ITokenStore {
    setItem<T>(key: string, value: T, expiryInSeconds?: number): Promise<void>;
    getItem<T>(key: string): Promise<T | null>;
    deleteItem(key: string): Promise<void>;
}