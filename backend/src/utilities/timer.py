import logging
import time


class Timer:
    def __init__(self, name, log_level=logging.INFO):
        self.name = name
        self.log_level = log_level
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()

    def __exit__(self, type, value, traceback):
        elapsed_time = time.time() - self.start_time
        logging.log(self.log_level, f"{self.name} took {elapsed_time:.2f} seconds.")


# Initialize logging configuration
logging.basicConfig(level=logging.INFO)
