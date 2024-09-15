import { Box, Text, useDimensions } from '@chakra-ui/react';
import { useMemo, useRef, MouseEvent, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { CreateMemeData } from '../routes/_authentication/create';

export type MemePictureEditorProps = {
  pictureUrl: string;
  texts: {
    content: string;
    x: number;
    y: number;
  }[];
};

const REF_WIDTH = 800;
const REF_HEIGHT = 450;
const REF_FONT_SIZE = 36;

export const MemePictureEditor: React.FC<MemePictureEditorProps> = ({
  pictureUrl,
  texts: rawTexts,
}) => {
  const { setValue } = useFormContext<CreateMemeData>();
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [initialMousePos, setInitialMousePos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef, true);
  const boxWidth = dimensions?.borderBox.width;
  const allContents = rawTexts.map((text) => text.content).join();
  const allX = rawTexts.map((text) => text.x).join();
  const allY = rawTexts.map((text) => text.y).join();

  const { height, fontSize, texts } = useMemo(() => {
    if (!boxWidth) {
      return { height: 0, fontSize: 0, texts: rawTexts };
    }

    return {
      height: (boxWidth / REF_WIDTH) * REF_HEIGHT,
      fontSize: (boxWidth / REF_WIDTH) * REF_FONT_SIZE,
      texts: rawTexts.map((text) => ({
        ...text,
        x: (boxWidth / REF_WIDTH) * text.x,
        y: (boxWidth / REF_WIDTH) * text.y,
      })),
    };
  }, [boxWidth, rawTexts, allContents, allX, allY]);

  const handleMouseDown = (
    e: MouseEvent<HTMLParagraphElement>,
    index: number
  ) => {
    setDraggingIndex(index);
    setInitialMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (draggingIndex === null || initialMousePos === null) return;
    const scale = boxWidth ? boxWidth / REF_WIDTH : 1;

    const dx = (e.clientX - initialMousePos.x) / scale;
    const dy = (e.clientY - initialMousePos.y) / scale;

    setValue(`texts.${draggingIndex}.x`, rawTexts[draggingIndex].x + dx);
    setValue(`texts.${draggingIndex}.y`, rawTexts[draggingIndex].y + dy);

    setInitialMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
    setInitialMousePos(null);
  };

  return (
    <Box
      width="full"
      height={height}
      ref={containerRef}
      backgroundImage={pictureUrl}
      backgroundColor="gray.100"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
      backgroundSize="contain"
      overflow="hidden"
      position="relative"
      borderRadius={8}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {texts.map((text, index) => (
        <Text
          key={index}
          position="absolute"
          left={text.x}
          top={text.y}
          fontSize={fontSize}
          color="white"
          fontFamily="Impact"
          fontWeight="bold"
          userSelect="none"
          textTransform="uppercase"
          style={{ WebkitTextStroke: '1px black' }}
          onMouseDown={(e) => handleMouseDown(e, index)}
        >
          {text.content}
        </Text>
      ))}
    </Box>
  );
};
