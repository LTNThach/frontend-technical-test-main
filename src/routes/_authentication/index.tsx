import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  Avatar,
  Box,
  Collapse,
  Flex,
  Icon,
  LinkBox,
  LinkOverlay,
  StackDivider,
  Text,
  Input,
  VStack,
  Button,
} from '@chakra-ui/react';
import { CaretDown, CaretUp, Chat } from '@phosphor-icons/react';
import { format } from 'timeago.js';
import {
  createMemeComment,
  getMemeComments,
  GetMemeCommentsResponse,
  getMemes,
  GetMemesResponse,
  getUserById,
  GetUserByIdResponse,
} from '../../api';
import { useAuthToken } from '../../contexts/authentication';
import { Loader } from '../../components/loader';
import { MemePicture } from '../../components/meme-picture';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Controller, useForm } from 'react-hook-form';

type CommentWithAuthor = GetMemeCommentsResponse['results'][0] & {
  author: GetUserByIdResponse;
};

type MemeWithAuthorAndComment = GetMemesResponse['results'][0] & {
  author: GetUserByIdResponse;
  comments: CommentWithAuthor[];
};

type MemesWithAuthorResponse = {
  memes: MemeWithAuthorAndComment[];
  totalPage: number;
};

type CommentsWithAuthorResponse = {
  comments: CommentWithAuthor[];
  totalPage: number;
};

export const MemeFeedPage: React.FC = () => {
  const token = useAuthToken();
  const [memes, setMemes] = useState<MemeWithAuthorAndComment[]>([]);

  const {
    isFetchingNextPage,
    isLoading,
    data: memeDatas,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['memes', token],
    queryFn: async ({ pageParam }) => {
      const memesResponse = await getMemes(token, pageParam);

      const memesWithAuthorPromises = memesResponse.results.map(
        async (meme) => {
          const author = await getUserById(token, meme.authorId);
          return {
            ...meme,
            author,
            comments: [],
          } as MemeWithAuthorAndComment;
        }
      );

      return {
        memes: await Promise.all(memesWithAuthorPromises),
        totalPage: Math.ceil(memesResponse.total / memesResponse.pageSize),
      } as MemesWithAuthorResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPageIndex = allPages.length + 1;
      return nextPageIndex <= lastPage.totalPage ? nextPageIndex : undefined;
    },
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      return await getUserById(token, jwtDecode<{ id: string }>(token).id);
    },
  });

  const [openedCommentSection, setOpenedCommentSection] = useState<
    string | null
  >(null);
  const { control, resetField, handleSubmit } = useForm<{
    commentContent: Record<string, string>;
  }>({
    defaultValues: {
      commentContent: {},
    },
  });

  const {
    data: commentsData,
    isLoading: isLoadingComments,
    fetchNextPage: fetchNextCommentPage,
    hasNextPage: hasMoreComments,
    isFetchingNextPage: isFetchingNextComments,
    refetch: refetchComments,
  } = useInfiniteQuery({
    queryKey: ['memes.comments', openedCommentSection, token],
    queryFn: async ({ pageParam }) => {
      const commentsResponse = await await getMemeComments(
        token,
        openedCommentSection!,
        pageParam
      );

      const commentsWithAuthorPromises = commentsResponse.results.map(
        async (comment) => {
          const commentAuthor = await getUserById(token, comment.authorId);
          return { ...comment, author: commentAuthor } as CommentWithAuthor;
        }
      );

      return {
        comments: await Promise.all(commentsWithAuthorPromises),
        totalPage: Math.ceil(
          commentsResponse.total / commentsResponse.pageSize
        ),
      } as CommentsWithAuthorResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPageIndex = allPages.length + 1;
      return nextPageIndex <= lastPage.totalPage ? nextPageIndex : undefined;
    },
    enabled: !!openedCommentSection,
  });

  const { mutateAsync } = useMutation({
    mutationFn: async (data: { memeId: string; content: string }) => {
      await createMemeComment(token, data.memeId, data.content);
    },
  });

  useEffect(() => {
    setMemes(memeDatas?.pages.flatMap((page) => page.memes) || []);
  }, [memeDatas]);

  useEffect(() => {
    if (commentsData && memes) {
      const openedMemeIndex = memes.findIndex(
        (meme) => meme.id === openedCommentSection
      );

      if (openedMemeIndex !== -1) {
        setMemes((prevMemes) => {
          const newMemes = [...prevMemes];

          newMemes[openedMemeIndex] = {
            ...newMemes[openedMemeIndex],
            comments:
              commentsData?.pages.flatMap((page) => page.comments) || [],
          };

          return newMemes;
        });
      }
    }
  }, [memes, commentsData, openedCommentSection]);

  if (isLoading) {
    return <Loader data-testid="meme-feed-loader" />;
  }

  return (
    <Flex width="full" height="full" justifyContent="center" overflowY="auto">
      <VStack
        p={4}
        width="full"
        height="max-content"
        maxWidth={800}
        divider={<StackDivider border="gray.200" />}
      >
        {memes.map((meme, memeIdx) => {
          return (
            <VStack key={meme.id} p={4} width="full" align="stretch">
              <Flex justifyContent="space-between" alignItems="center">
                <Flex>
                  <Avatar
                    borderWidth="1px"
                    borderColor="gray.300"
                    size="xs"
                    name={meme.author.username}
                    src={meme.author.pictureUrl}
                  />
                  <Text ml={2} data-testid={`meme-author-${meme.id}`}>
                    {meme.author.username}
                  </Text>
                </Flex>
                <Text fontStyle="italic" color="gray.500" fontSize="small">
                  {format(meme.createdAt)}
                </Text>
              </Flex>
              <MemePicture
                pictureUrl={meme.pictureUrl}
                texts={meme.texts}
                dataTestId={`meme-picture-${meme.id}`}
              />
              <Box>
                <Text fontWeight="bold" fontSize="medium" mb={2}>
                  Description:{' '}
                </Text>
                <Box
                  p={2}
                  borderRadius={8}
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Text
                    color="gray.500"
                    whiteSpace="pre-line"
                    data-testid={`meme-description-${meme.id}`}
                  >
                    {meme.description}
                  </Text>
                </Box>
              </Box>
              <LinkBox as={Box} py={2} borderBottom="1px solid black">
                <Flex justifyContent="space-between" alignItems="center">
                  <Flex alignItems="center">
                    <LinkOverlay
                      data-testid={`meme-comments-section-${meme.id}`}
                      cursor="pointer"
                      onClick={() =>
                        setOpenedCommentSection(
                          openedCommentSection === meme.id ? null : meme.id
                        )
                      }
                    >
                      <Text data-testid={`meme-comments-count-${meme.id}`}>
                        {meme.commentsCount} comments
                      </Text>
                    </LinkOverlay>
                    <Icon
                      as={
                        openedCommentSection !== meme.id ? CaretDown : CaretUp
                      }
                      ml={2}
                      mt={1}
                    />
                  </Flex>
                  <Icon as={Chat} />
                </Flex>
              </LinkBox>
              <Collapse in={openedCommentSection === meme.id} animateOpacity>
                <Box mb={6}>
                  <form
                    onSubmit={handleSubmit(async (data) => {
                      if (data.commentContent[meme.id]) {
                        await mutateAsync({
                          memeId: meme.id,
                          content: data.commentContent[meme.id],
                        });
                        refetchComments();

                        resetField(`commentContent.${meme.id}`, {
                          defaultValue: '',
                        });
                        setMemes((prevMemes) => {
                          const newMemes = [...prevMemes];

                          newMemes[memeIdx] = {
                            ...newMemes[memeIdx],
                            commentsCount: newMemes[memeIdx].commentsCount + 1,
                          };

                          return newMemes;
                        });
                      }
                    })}
                  >
                    <Flex alignItems="center">
                      <Avatar
                        borderWidth="1px"
                        borderColor="gray.300"
                        name={user?.username}
                        src={user?.pictureUrl}
                        size="sm"
                        mr={2}
                      />
                      <Controller
                        name={`commentContent.${meme.id}`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="Type your comment here..."
                          />
                        )}
                      />
                    </Flex>
                  </form>
                </Box>
                <VStack align="stretch" spacing={4}>
                  {isLoadingComments ? (
                    <Loader data-testid="meme-comments-loader" />
                  ) : (
                    <>
                      {meme.comments.map((comment) => (
                        <Flex key={comment.id}>
                          <Avatar
                            borderWidth="1px"
                            borderColor="gray.300"
                            size="sm"
                            name={comment.author.username}
                            src={comment.author.pictureUrl}
                            mr={2}
                          />
                          <Box p={2} borderRadius={8} bg="gray.50" flexGrow={1}>
                            <Flex
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Flex>
                                <Text
                                  data-testid={`meme-comment-author-${meme.id}-${comment.id}`}
                                >
                                  {comment.author.username}
                                </Text>
                              </Flex>
                              <Text
                                fontStyle="italic"
                                color="gray.500"
                                fontSize="small"
                              >
                                {format(comment.createdAt)}
                              </Text>
                            </Flex>
                            <Text
                              color="gray.500"
                              whiteSpace="pre-line"
                              data-testid={`meme-comment-content-${meme.id}-${comment.id}`}
                            >
                              {comment.content}
                            </Text>
                          </Box>
                        </Flex>
                      ))}
                      {hasMoreComments && (
                        <Button
                          colorScheme="cyan"
                          variant="outline"
                          mt={4}
                          size="md"
                          isLoading={isFetchingNextComments}
                          onClick={() => {
                            fetchNextCommentPage();
                          }}
                        >
                          Show more comments
                        </Button>
                      )}
                    </>
                  )}
                </VStack>
              </Collapse>
            </VStack>
          );
        })}
        {hasNextPage && (
          <Button
            colorScheme="cyan"
            variant="outline"
            mt={4}
            size="lg"
            isLoading={isFetchingNextPage}
            onClick={() => {
              fetchNextPage();
            }}
          >
            Show more
          </Button>
        )}
      </VStack>
    </Flex>
  );
};

export const Route = createFileRoute('/_authentication/')({
  component: MemeFeedPage,
});
