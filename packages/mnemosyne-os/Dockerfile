FROM alpine:latest

# Install "hollywood hacker" tools and a shell
RUN apk add --no-cache bash cmatrix hollywood neofetch

# Create a user
RUN adduser -D user

# Set up the custom assets
COPY assets/ /home/user/

# Set the ownership of the home directory
RUN chown -R user:user /home/user

# Set the user and workdir
USER user
WORKDIR /home/user

# Set the custom motd
RUN echo "cat /home/user/motd" >> /home/user/.bash_profile

# Start a bash shell
CMD ["/bin/bash"]
