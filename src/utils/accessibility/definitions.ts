export const genericErrors: Record<string, string> = {
    UserRejected: 'Wallet Dialog was closed by the user',
    UnknownError: 'Unknown error occurred',
    IndexingInProgress: 'Node is still indexing. Please try again shortly'
};

export const errorDefinitions: Record<string, string> = {
    ...genericErrors
};
