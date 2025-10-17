FROM debian:bullseye-slim

# Install "hollywood hacker" tools and a shell
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    cmatrix \
    hollywood \
    neofetch \
    && rm -rf /var/lib/apt/lists/*

# Create a user
RUN useradd -m -s /bin/bash user

# Create the test script
RUN echo -e '#!/bin/sh\necho "Mnemosyne test script running!"' > /usr/local/bin/mnemosyne-test && \
    chmod +x /usr/local/bin/mnemosyne-test

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