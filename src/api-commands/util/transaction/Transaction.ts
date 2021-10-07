export interface Transaction{
    subj: string | null,
    pred: string | null,
    obj: string | null,
    action: "ADD" | "UPDATE" | "DELETE" | "GET" | "SIZE" | "COMMIT"
    graph: string | null
    body: string
    location: string
}