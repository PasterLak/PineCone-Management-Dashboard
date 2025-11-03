#
# "main" pseudo-component makefile.
#
# (Uses default behaviour of compiling all source files in directory, adding 'include' to include path.)

# Add all .cpp files in this folder
COMPONENT_SRCS += $(COMPONENT_PATH)/delta_time.cpp

# Include directory for the headers
COMPONENT_ADD_INCLUDEDIRS += $(COMPONENT_PATH)
