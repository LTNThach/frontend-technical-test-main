# Review meme feed code

## Problems

The page to show the feed of memes has the following problems:

- It take too long to load the memes because the query try to fetch linearly all the pages of memes
- It also need to get the information of every author of the memes
- It also try to fetch linearly all the pages of comments of the memes and its author

The query is very huge and doesn't take the advantage of the API that is the pagination. By fetching linearly all the data (memes, comments), it take a lot of time to finish all the API calls.

## Solutions

To fix this, I suggest to separate the fetching for memes and comments in two separates queries. As the comments is shown only when the user click the comment section. So, I will feth the comments only when the user click on a meme's comment section.

For the 2 queries, to get the author's data, I use the `Promise.all` to fetching the data in parallel to reduce the execution time.

Also, as the API provide a paginated result, I add simple pagination for the memes and the comments with a button `Show more` and using `useInfiniteQuery` to fetch the next page. So in the beginning, the page will fetch only the first page of memes. When the user opens a comment section, the page will fetch only the first page of comments. When the user clicks on the button `Show more`, the infinite query will fetch the next page (memes or comments) and append the result to the current data and display it.

With this approach, the initial load of the page is much faster now. There are also other options for the pagination on UI side like an infinite scroll or a pagination with page numbers, etc.