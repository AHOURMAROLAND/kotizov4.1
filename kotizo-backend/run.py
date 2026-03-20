import asyncio
import sys
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

if __name__ == '__main__':
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)