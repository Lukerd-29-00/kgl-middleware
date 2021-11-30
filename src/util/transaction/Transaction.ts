export interface Transaction{
    subj: string | null,
    pred: string | null,
    obj: string | null,
    action: "ADD" | "UPDATE" | "DELETE" | "GET" | "SIZE" | "COMMIT" | "QUERY"
    body: string
    location: string
}