"""Enumerate NTFS named streams without opening or changing their contents."""
import ctypes,os
from ctypes import wintypes
if os.name=='nt':
 class StreamData(ctypes.Structure):
  _fields_=[('size',ctypes.c_longlong),('name',ctypes.c_wchar*296)]
 kernel=ctypes.WinDLL('kernel32',use_last_error=True)
 kernel.FindFirstStreamW.argtypes=[wintypes.LPCWSTR,ctypes.c_int,ctypes.POINTER(StreamData),wintypes.DWORD]
 kernel.FindFirstStreamW.restype=wintypes.HANDLE
 kernel.FindNextStreamW.argtypes=[wintypes.HANDLE,ctypes.POINTER(StreamData)]
 kernel.FindNextStreamW.restype=wintypes.BOOL
 kernel.FindClose.argtypes=[wintypes.HANDLE]
def named_streams(path):
 if os.name!='nt':return []
 info=StreamData();handle=kernel.FindFirstStreamW(str(path),0,ctypes.byref(info),0)
 if handle==ctypes.c_void_p(-1).value:
  error=ctypes.get_last_error()
  if error in (2,3,38):return []
  raise OSError(error,'Cannot enumerate streams safely: '+str(path))
 result=[]
 try:
  while True:
   if info.name!='::$DATA':result.append({'name':info.name,'bytes':info.size})
   if not kernel.FindNextStreamW(handle,ctypes.byref(info)):
    error=ctypes.get_last_error()
    if error not in (0,38):raise OSError(error,'Incomplete stream enumeration: '+str(path))
    break
 finally:kernel.FindClose(handle)
 return result
