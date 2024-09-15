import { screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AuthenticationContext } from '../../../contexts/authentication';
import { MemeFeedPage } from '../../../routes/_authentication/index';
import { renderWithRouter } from '../../utils';
import userEvent from '@testing-library/user-event';

describe('routes/_authentication/index', () => {
  describe('MemeFeedPage', () => {
    window.scrollTo = vi.fn();

    function renderMemeFeedPage() {
      return renderWithRouter({
        component: MemeFeedPage,
        Wrapper: ({ children }) => (
          <ChakraProvider>
            <QueryClientProvider client={new QueryClient()}>
              <AuthenticationContext.Provider
                value={{
                  state: {
                    isAuthenticated: true,
                    userId: 'dummy_user_id',
                    token: 'dummy_token',
                  },
                  authenticate: () => {},
                  signout: () => {},
                }}
              >
                {children}
              </AuthenticationContext.Provider>
            </QueryClientProvider>
          </ChakraProvider>
        ),
      });
    }

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch the memes and display them with their comments', async () => {
      const user = userEvent.setup();

      renderMemeFeedPage();

      // We check that the right author's username is displayed
      expect(
        await screen.findByTestId('meme-author-dummy_meme_id_1')
      ).toHaveTextContent('dummy_user_1');

      // We check that the right meme's picture is displayed
      expect(
        await screen.findByTestId('meme-picture-dummy_meme_id_1')
      ).toHaveStyle({
        'background-image': 'url("https://dummy.url/meme/1")',
      });

      // We check that the right texts are displayed at the right positions
      const text1 = await screen.findByTestId(
        'meme-picture-dummy_meme_id_1-text-0'
      );
      const text2 = await screen.findByTestId(
        'meme-picture-dummy_meme_id_1-text-1'
      );
      expect(text1).toHaveTextContent('dummy text 1');
      expect(text1).toHaveStyle({
        top: '0px',
        left: '0px',
      });
      expect(text2).toHaveTextContent('dummy text 2');
      expect(text2).toHaveStyle({
        top: '100px',
        left: '100px',
      });

      // We check that the right description is displayed
      expect(
        await screen.findByTestId('meme-description-dummy_meme_id_1')
      ).toHaveTextContent('dummy meme 1');

      // We check that the right number of comments is displayed
      expect(
        await screen.findByTestId('meme-comments-count-dummy_meme_id_1')
      ).toHaveTextContent('3 comments');

      // We check the the comment section button is displayed for meme
      const commentsSectionMeme1 = await screen.findByTestId(
        'meme-comments-section-dummy_meme_id_1'
      );
      expect(commentsSectionMeme1).toBeInTheDocument();
      await user.click(commentsSectionMeme1);

      // We check that the right comments with the right authors are displayed
      expect(
        await screen.findByTestId(
          'meme-comment-content-dummy_meme_id_1-dummy_comment_id_1'
        )
      ).toHaveTextContent('dummy comment 1');
      expect(
        await screen.findByTestId(
          'meme-comment-author-dummy_meme_id_1-dummy_comment_id_1'
        )
      ).toHaveTextContent('dummy_user_1');

      expect(
        await screen.findByTestId(
          'meme-comment-content-dummy_meme_id_1-dummy_comment_id_2'
        )
      ).toHaveTextContent('dummy comment 2');
      expect(
        await screen.findByTestId(
          'meme-comment-author-dummy_meme_id_1-dummy_comment_id_2'
        )
      ).toHaveTextContent('dummy_user_2');

      expect(
        await screen.findByTestId(
          'meme-comment-content-dummy_meme_id_1-dummy_comment_id_3'
        )
      ).toHaveTextContent('dummy comment 3');
      expect(
        await screen.findByTestId(
          'meme-comment-author-dummy_meme_id_1-dummy_comment_id_3'
        )
      ).toHaveTextContent('dummy_user_3');
    });

    it('should create new comment to a meme', async () => {
      const user = userEvent.setup();

      renderMemeFeedPage();

      // We check that the right author's username is displayed
      expect(
        await screen.findByTestId('meme-author-dummy_meme_id_1')
      ).toHaveTextContent('dummy_user_1');

      // We check that the right meme's picture is displayed
      expect(
        await screen.findByTestId('meme-picture-dummy_meme_id_1')
      ).toHaveStyle({
        'background-image': 'url("https://dummy.url/meme/1")',
      });

      // We check that the right description is displayed
      expect(
        await screen.findByTestId('meme-description-dummy_meme_id_1')
      ).toHaveTextContent('dummy meme 1');

      // We check that the right number of comments is displayed
      expect(
        await screen.findByTestId('meme-comments-count-dummy_meme_id_1')
      ).toHaveTextContent('3 comments');

      // We check the the comment section button is displayed for meme
      const commentsSectionMeme1 = await screen.findByTestId(
        'meme-comments-section-dummy_meme_id_1'
      );
      expect(commentsSectionMeme1).toBeInTheDocument();
      await user.click(commentsSectionMeme1);

      // We check that the right comments with the right authors are displayed
      expect(
        await screen.findByTestId(
          'meme-comment-content-dummy_meme_id_1-dummy_comment_id_1'
        )
      ).toHaveTextContent('dummy comment 1');
      expect(
        await screen.findByTestId(
          'meme-comment-author-dummy_meme_id_1-dummy_comment_id_1'
        )
      ).toHaveTextContent('dummy_user_1');

      const commentInput = await screen.findByPlaceholderText(
        'Type your comment here...'
      );
      expect(commentInput).toBeInTheDocument();

      await user.type(commentInput, 'This is my comment{enter}');

      // We check that the right number of comments is displayed
      expect(
        await screen.findByTestId('meme-comments-count-dummy_meme_id_1')
      ).toHaveTextContent('4 comments');

      // We check that the right comments with the right authors are displayed
      expect(
        await screen.findByTestId(
          'meme-comment-content-dummy_meme_id_1-dummy_comment_id_4'
        )
      ).toHaveTextContent('This is my comment');
      expect(
        await screen.findByTestId(
          'meme-comment-author-dummy_meme_id_1-dummy_comment_id_4'
        )
      ).toHaveTextContent('dummy_user_3');
    });
  });
});
