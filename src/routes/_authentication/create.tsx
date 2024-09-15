import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { MemeEditor } from '../../components/meme-editor';
import { useMemo, useState } from 'react';
import { MemePictureProps } from '../../components/meme-picture';
import { Plus, Trash } from '@phosphor-icons/react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { createMeme } from '../../api';
import { useAuthToken } from '../../contexts/authentication';

export const Route = createFileRoute('/_authentication/create')({
  component: CreateMemePage,
});

type Picture = {
  url: string;
  file: File;
};

export type CreateMemeData = {
  picture: File;
  description: string;
  texts: MemePictureProps['texts'];
};

function CreateMemePage() {
  const token = useAuthToken();
  const navigate = useNavigate();
  const methods = useForm<CreateMemeData>();
  const { control, register, watch, setValue, handleSubmit } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'texts' });
  const [picture, setPicture] = useState<Picture | null>(null);
  const texts = watch('texts');
  const { mutate } = useMutation({
    mutationFn: async (data: CreateMemeData) => {
      await createMeme(token, data.picture, data.description, data.texts);
    },
    onSuccess: () => {
      navigate({ to: '/' });
    },
  });

  const handleDrop = (file: File) => {
    setPicture({
      url: URL.createObjectURL(file),
      file,
    });
    setValue('picture', file);
  };

  const handleAddCaptionButtonClick = () => {
    append({
      content: `New caption ${fields.length + 1}`,
      x: Math.random() * 400,
      y: Math.random() * 225,
    });
  };

  const handleDeleteCaptionButtonClick = (index: number) => {
    remove(index);
  };

  const memePicture = useMemo(() => {
    if (!picture) {
      return undefined;
    }

    return {
      pictureUrl: picture.url,
      texts,
    };
  }, [picture, texts]);

  const onSubmit = (data: CreateMemeData) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
      <Flex width="full" height="full">
        <FormProvider {...methods}>
          <Box flexGrow={1} height="full" p={4} overflowY="auto">
            <VStack spacing={5} align="stretch">
              <Box>
                <Heading as="h2" size="md" mb={2}>
                  Upload your picture
                </Heading>
                <MemeEditor onDrop={handleDrop} memePicture={memePicture} />
              </Box>
              <Box>
                <Heading as="h2" size="md" mb={2}>
                  Describe your meme
                </Heading>
                <Textarea
                  {...register('description')}
                  placeholder="Type your description here..."
                />
              </Box>
            </VStack>
          </Box>
          <Flex
            flexDir="column"
            width="30%"
            minW="250"
            height="full"
            boxShadow="lg"
          >
            <Heading as="h2" size="md" mb={2} p={4}>
              Add your captions
            </Heading>
            <Box p={4} flexGrow={1} height={0} overflowY="auto">
              <VStack>
                {fields.map((_, index) => (
                  <Flex key={index} width="full">
                    <Input
                      {...register(`texts.${index}.content`)}
                      key={index}
                      mr={1}
                    />
                    <IconButton
                      onClick={() => handleDeleteCaptionButtonClick(index)}
                      aria-label="Delete caption"
                      icon={<Icon as={Trash} />}
                    />
                  </Flex>
                ))}
                <Button
                  colorScheme="cyan"
                  leftIcon={<Icon as={Plus} />}
                  variant="ghost"
                  size="sm"
                  width="full"
                  onClick={handleAddCaptionButtonClick}
                  isDisabled={memePicture === undefined}
                >
                  Add a caption
                </Button>
              </VStack>
            </Box>
            <HStack p={4}>
              <Button
                as={Link}
                to="/"
                colorScheme="cyan"
                variant="outline"
                size="sm"
                width="full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="cyan"
                size="sm"
                width="full"
                color="white"
                isDisabled={memePicture === undefined}
              >
                Submit
              </Button>
            </HStack>
          </Flex>
        </FormProvider>
      </Flex>
    </form>
  );
}
