import { useDropzone } from "react-dropzone";
import { AspectRatio, Box, Button, Flex, Icon, Text } from "@chakra-ui/react";
import { Image, Pencil } from "@phosphor-icons/react";
import { MemePictureEditor, MemePictureEditorProps } from "./meme-picture-editor";

export type MemeEditorProps = {
  onDrop: (file: File) => void;
  memePicture?: MemePictureEditorProps;
};

function renderNoPicture() {
  return (
    <Flex
      flexDir="column"
      width="full"
      height="full"
      alignItems="center"
      justifyContent="center"
    >
      <Icon as={Image} color="black" boxSize={16} />
      <Text>Select a picture</Text>
      <Text color="gray.400" fontSize="sm">
        or drop it in this area
      </Text>
    </Flex>
  );
}

function renderMemePicture(memePicture: MemePictureEditorProps, open: () => void) {
  return (
    <Box width="full" height="full" position="relative" __css={{
      "&:hover .change-picture-button": {
        display: "inline-block",
      },
      "& .change-picture-button": {
        display: "none",
      },
    }}>
      <MemePictureEditor {...memePicture} />
      <Button
        className="change-picture-button"
        leftIcon={<Icon as={Pencil} boxSize={4} />}
        colorScheme="cyan"
        color="white"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        position="absolute"
        onClick={open}
      >
        Change picture
      </Button>
    </Box>
  );
}

export const MemeEditor: React.FC<MemeEditorProps> = ({
  onDrop,
  memePicture,
}) => {
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: (files: File[]) => {
      if (files.length === 0) {
        return;
      }
      onDrop(files[0]);
    },
    noClick: memePicture !== undefined,
    accept: { "image/png": [".png"], "image/jpg": [".jpg"] },
  });

  return (
    <AspectRatio ratio={16 / 9}>
      <Box
        {...getRootProps()}
        width="full"
        position="relative"
        border={!memePicture ? "1px dashed" : undefined}
        borderColor="gray.300"
        borderRadius={9}
        px={1}
      >
        <input {...getInputProps()} />
        {memePicture ? renderMemePicture(memePicture, open) : renderNoPicture()}
      </Box>
    </AspectRatio>
  );
};
