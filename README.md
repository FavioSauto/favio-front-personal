# To do

[x] Modularize and divide and conquer the code, there are many files with too much code
[x] Fetching events error fix
[x] Fix the issue that re-fetches the states on every page change (start in dashboard everything loads, go to stats page, go back to dashboard it refetches info that it's already there)
[x] Add a manual refetch of transactions events in the top right corner of the table
[x] Form inputs onChange re renders everything and not only the input
[-] Move table definitions to another file (Figure out which file) --> After considering it for a little longer it's not worth it at the moment
[X] TransactionHistoryTable Improvements with more info
[X] Approval improvements
[] Figure out how to listen for new events associated with a wallet (e.g. A user transfers funds to the active user of the app the active user should receive a notification and the new transfer event should be added to the table).
[] Try making cardbalances and transactionhistorytable a react server component
[] Implement that a user can use their approved amounts
