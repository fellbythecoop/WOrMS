'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Chip,
  Stack,
  Typography,
  Autocomplete,
  Paper,
  Popper,
  PopperProps,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';

interface TagManagerProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

// Define a set of bold colors for tags
const TAG_COLORS = [
  '#1976d2', // blue
  '#388e3c', // green
  '#f57c00', // orange
  '#7b1fa2', // purple
  '#c2185b', // pink
  '#d32f2f', // red
  '#0288d1', // light blue
  '#689f38', // light green
  '#fbc02d', // yellow
  '#5d4037', // brown
  '#455a64', // blue grey
  '#e64a19', // deep orange
  '#303f9f', // indigo
  '#00796b', // teal
];

// Function to generate a consistent color for a tag
const getTagColor = (tag: string): string => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
};

// Custom Popper component for autocomplete
const CustomPopper = (props: PopperProps) => {
  return (
    <Popper {...props} placement="bottom-start" sx={{ zIndex: 9999 }}>
      <Paper sx={{ maxHeight: 200, overflow: 'auto' }}>{props.children}</Paper>
    </Popper>
  );
};

export function TagManager({
  selectedTags,
  onTagsChange,
  label = 'Tags',
  placeholder = 'Select or create tags...',
  size = 'small',
  disabled = false,
}: TagManagerProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Fetch available tags from backend
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/work-orders/tags');
        setAvailableTags(response.data || []);
      } catch (error) {
        console.error('Error fetching tags:', error);
        setAvailableTags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Handle tag selection/creation
  const handleTagChange = (event: any, newValue: string[]) => {
    onTagsChange(newValue);
  };

  // Handle creating new tags
  const handleCreateTag = (newTag: string) => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      const updatedTags = [...selectedTags, trimmedTag];
      onTagsChange(updatedTags);
      
      // Add to available tags if not already present
      if (!availableTags.includes(trimmedTag)) {
        setAvailableTags(prev => [...prev, trimmedTag].sort());
      }
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(updatedTags);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label}
      </Typography>
      
      {/* Display selected tags */}
      {selectedTags.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
          {selectedTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={disabled ? undefined : () => handleRemoveTag(tag)}
              size={size}
              sx={{
                backgroundColor: getTagColor(tag),
                color: 'white',
                fontWeight: 'bold',
                '& .MuiChip-deleteIcon': {
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    color: 'white',
                  },
                },
              }}
            />
          ))}
        </Stack>
      )}

      {/* Autocomplete for tag selection/creation */}
      {!disabled && (
        <Autocomplete
          multiple
          freeSolo
          options={availableTags}
          value={selectedTags}
          onChange={handleTagChange}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          filterSelectedOptions
          size={size}
          loading={loading}
          PopperComponent={CustomPopper}
          renderInput={(params) => (
            <TextField
              {...params}
              label={`Add ${label}`}
              placeholder={placeholder}
              variant="outlined"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && inputValue.trim()) {
                  event.preventDefault();
                  handleCreateTag(inputValue);
                  setInputValue('');
                }
              }}
            />
          )}
          renderTags={() => null} // Don't render tags in the input (we show them above)
          renderOption={(props, option) => (
            <li {...props}>
              <Chip
                label={option}
                size="small"
                sx={{
                  backgroundColor: getTagColor(option),
                  color: 'white',
                  fontWeight: 'bold',
                  mr: 1,
                }}
              />
              {option}
            </li>
          )}
          getOptionLabel={(option) => option}
          filterOptions={(options, params) => {
            const filtered = options.filter(option =>
              option.toLowerCase().includes(params.inputValue.toLowerCase())
            );

            const { inputValue } = params;
            const isExisting = options.some(option => inputValue === option);
            if (inputValue !== '' && !isExisting) {
              filtered.push(inputValue);
            }

            return filtered;
          }}
          isOptionEqualToValue={(option, value) => option === value}
        />
      )}
    </Box>
  );
} 